import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveOffcanvas, NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ContentStore } from '../../../app/core/services/content-store';
import { AdminDataService } from '../../core/admin-data.service';
import { Enquiry, EnquirySource, EnquiryStatus } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import { newId } from '../../core/local-collection';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';

const toStruct = (iso: string | null): NgbDateStruct | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};
const fromStruct = (s: NgbDateStruct | null): string | null =>
  s ? new Date(s.year, s.month - 1, s.day, 12).toISOString() : null;

const ENQUIRY_SOURCES: EnquirySource[] = ['WhatsApp', 'Phone call', 'Walk-in', 'Website'];
export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Converted',
  'Closed',
];

@Component({
  selector: 'app-enquiry-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgbInputDatepicker,
    NumbersOnlyDirective,
    AdminCard,
  ],
  templateUrl: './enquiry-form.html',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `,
})
export class EnquiryForm implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly store = inject(ContentStore);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);
  readonly offcanvas = inject(NgbActiveOffcanvas);

  // null when adding a new enquiry
  enquiry: Enquiry | null = null;

  readonly sources = ENQUIRY_SOURCES;
  readonly statuses = ENQUIRY_STATUSES;
  readonly submitted = signal(false);
  readonly products = computed(() =>
    this.store
      .products()
      .map((p) => ({ code: p.code, name: p.name, label: `${p.code} · ${p.name}` })),
  );
  readonly users = computed(() => this.data.users.all().filter((u) => u.active));
  private readonly productName = signal('');
  private readonly mobile = signal('');

  readonly whatsappHref = computed(() => {
    const m = this.mobile();
    return /^\d{10}$/.test(m) ? `https://wa.me/91${m}` : null;
  });

  readonly form = this.fb.group({
    customerName: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    mobile: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    email: this.fb.nonNullable.control('', Validators.email),
    productCode: this.fb.control<string | null>(null),
    date: this.fb.control<NgbDateStruct | null>(
      toStruct(new Date().toISOString()),
      Validators.required,
    ),
    source: this.fb.nonNullable.control<EnquirySource>('WhatsApp'),
    message: this.fb.nonNullable.control(''),
    status: this.fb.nonNullable.control<EnquiryStatus>('New'),
    followUpDate: this.fb.control<NgbDateStruct | null>(null),
    assignedTo: this.fb.control<string | null>(null),
    notes: this.fb.nonNullable.control(''),
  });

  ngOnInit(): void {
    const e = this.enquiry;
    if (e) {
      this.form.patchValue({
        ...e,
        productCode: e.productCode || null,
        date: toStruct(e.date),
        followUpDate: toStruct(e.followUpDate),
        assignedTo: e.assignedTo || null,
      });
      this.productName.set(e.productName);
      this.mobile.set(e.mobile);
    }
    this.form.controls.mobile.valueChanges.subscribe((m) => this.mobile.set(String(m ?? '')));
  }

  onProduct(item: { name: string } | undefined): void {
    this.productName.set(item?.name ?? '');
  }

  invalid(name: 'customerName' | 'mobile' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      void this.alerts.error(
        'Please check the form',
        'Customer name, a 10-digit mobile number and the date are required.',
      );
      return;
    }
    const v = this.form.getRawValue();
    if (
      this.enquiry &&
      !(await this.alerts.confirm('Update this enquiry?', `${v.customerName} · ${v.status}`))
    )
      return;
    const record: Enquiry = {
      id: this.enquiry?.id ?? newId('enq'),
      customerName: v.customerName.trim(),
      mobile: String(v.mobile),
      email: v.email.trim(),
      productCode: v.productCode ?? '',
      productName: v.productCode ? this.productName() : '',
      date: fromStruct(v.date) ?? new Date().toISOString(),
      source: v.source,
      status: v.status,
      message: v.message.trim(),
      followUpDate: fromStruct(v.followUpDate),
      assignedTo: v.assignedTo ?? '',
      notes: v.notes.trim(),
    };
    this.data.enquiries.upsert(record);
    this.offcanvas.close(record);
    void this.alerts.success(
      this.enquiry ? 'Enquiry updated' : 'Enquiry added',
      record.customerName,
    );
  }
}

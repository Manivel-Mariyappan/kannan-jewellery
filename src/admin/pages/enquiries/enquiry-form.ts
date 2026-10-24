import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
const fromStruct = (s: NgbDateStruct | null): string | null => (s ? new Date(s.year, s.month - 1, s.day, 12).toISOString() : null);

export const ENQUIRY_SOURCES: EnquirySource[] = ['WhatsApp', 'Phone call', 'Walk-in', 'Website'];
export const ENQUIRY_STATUSES: EnquiryStatus[] = ['New', 'Contacted', 'Follow-up', 'Converted', 'Closed'];

@Component({
  selector: 'app-enquiry-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgSelectComponent, NgbInputDatepicker, NumbersOnlyDirective, AdminCard],
  template: `
    <div class="offcanvas-header border-bottom bg-white">
      <h2 class="offcanvas-title h5 mb-0" id="enquiry-form-title">{{ enquiry ? 'Edit enquiry' : 'Add enquiry' }}</h2>
      <button type="button" class="btn-close" aria-label="Close" (click)="offcanvas.dismiss()"></button>
    </div>

    <form class="offcanvas-body bg-body-tertiary" [formGroup]="form" (ngSubmit)="save()" id="enquiry-form" novalidate>
      <admin-card heading="Customer" subtitle="Who enquired" icon="☺" [required]="true">
        @if (whatsappHref(); as href) {
          <a card-actions class="btn btn-sm btn-success" [href]="href" target="_blank" rel="noopener">Reply on WhatsApp</a>
        }
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="e-name">Customer name <span class="text-danger">*</span></label>
            <input id="e-name" class="form-control" formControlName="customerName" [class.is-invalid]="invalid('customerName')" />
            <div class="invalid-feedback">Customer name is required.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="e-mobile">Mobile <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text">+91</span>
              <input id="e-mobile" class="form-control" type="text" maxlength="10" formControlName="mobile" appNumbersOnly [decimals]="0" [class.is-invalid]="invalid('mobile')" />
            </div>
            @if (invalid('mobile')) { <div class="invalid-feedback d-block">Enter a 10-digit mobile number.</div> }
          </div>
          <div class="col-12">
            <label class="form-label" for="e-email">Email</label>
            <input id="e-email" class="form-control" type="email" formControlName="email" [class.is-invalid]="invalid('email')" />
          </div>
        </div>
      </admin-card>

      <admin-card heading="Enquiry" subtitle="Product, source and message" icon="✉" [required]="true">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="e-product">Product</label>
            <ng-select
              labelForId="e-product"
              formControlName="productCode"
              [items]="products()"
              bindLabel="label"
              bindValue="code"
              placeholder="Search by name or product code"
              (change)="onProduct($event)"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="e-date">Enquiry date <span class="text-danger">*</span></label>
            <div class="input-group">
              <input id="e-date" class="form-control" formControlName="date" ngbDatepicker #d1="ngbDatepicker" placeholder="dd-mm-yyyy" readonly (click)="d1.toggle()" />
              <button class="btn btn-outline-secondary" type="button" (click)="d1.toggle()" aria-label="Open calendar">📅</button>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="e-source">Source</label>
            <ng-select labelForId="e-source" formControlName="source" [items]="sources" [clearable]="false" [searchable]="false" />
          </div>
          <div class="col-12">
            <label class="form-label" for="e-msg">Customer message</label>
            <textarea id="e-msg" class="form-control" rows="3" formControlName="message"></textarea>
          </div>
        </div>
      </admin-card>

      <admin-card heading="Follow-up" subtitle="Status and next action" icon="◷">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="e-status">Status</label>
            <ng-select labelForId="e-status" formControlName="status" [items]="statuses" [clearable]="false" [searchable]="false" />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="e-fu">Follow-up date</label>
            <div class="input-group">
              <input id="e-fu" class="form-control" formControlName="followUpDate" ngbDatepicker #d2="ngbDatepicker" placeholder="dd-mm-yyyy" readonly (click)="d2.toggle()" />
              <button class="btn btn-outline-secondary" type="button" (click)="d2.toggle()" aria-label="Open calendar">📅</button>
              <button class="btn btn-outline-secondary" type="button" (click)="form.controls.followUpDate.setValue(null)" aria-label="Clear date">✕</button>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="e-assign">Assigned to</label>
            <ng-select labelForId="e-assign" formControlName="assignedTo" [items]="users()" bindLabel="fullName" bindValue="username" placeholder="Unassigned" />
          </div>
          <div class="col-12">
            <label class="form-label" for="e-notes">Internal notes</label>
            <textarea id="e-notes" class="form-control" rows="2" formControlName="notes"></textarea>
          </div>
        </div>
      </admin-card>
    </form>

    <div class="border-top bg-white p-3 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" (click)="offcanvas.dismiss()">Cancel</button>
      <button type="submit" form="enquiry-form" class="btn btn-primary px-4">{{ enquiry ? 'Update enquiry' : 'Add enquiry' }}</button>
    </div>
  `,
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

  /** Set by the opener; null for a new enquiry. */
  enquiry: Enquiry | null = null;

  readonly sources = ENQUIRY_SOURCES;
  readonly statuses = ENQUIRY_STATUSES;
  readonly submitted = signal(false);
  readonly products = computed(() => this.store.products().map((p) => ({ code: p.code, name: p.name, label: `${p.code} · ${p.name}` })));
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
    date: this.fb.control<NgbDateStruct | null>(toStruct(new Date().toISOString()), Validators.required),
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
      this.form.patchValue({ ...e, productCode: e.productCode || null, date: toStruct(e.date), followUpDate: toStruct(e.followUpDate), assignedTo: e.assignedTo || null });
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
      void this.alerts.error('Please check the form', 'Customer name, a 10-digit mobile number and the date are required.');
      return;
    }
    const v = this.form.getRawValue();
    if (this.enquiry && !(await this.alerts.confirm('Update this enquiry?', `${v.customerName} · ${v.status}`))) return;
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
    void this.alerts.success(this.enquiry ? 'Enquiry updated' : 'Enquiry added', record.customerName);
  }
}

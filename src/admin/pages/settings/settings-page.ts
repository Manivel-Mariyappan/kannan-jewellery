import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ShopSettings } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { normaliseWhatsappNumber } from '../../../app/core/services/whatsapp.service';
import { downloadJson } from '../../../app/core/utils/download';
import { AdminAlerts } from '../../core/alerts.service';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgSelectComponent, NumbersOnlyDirective, AdminCard],
  templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
  private readonly store = inject(ContentStore);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);

  readonly states = INDIAN_STATES;
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    shopName: ['', Validators.required],
    tagline: [''],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: [''],
    state: this.fb.control<string | null>(null),
    postalCode: [''],
    phone: [''],
    whatsappNumber: ['', Validators.pattern(/^\d{10,15}$/)],
    email: ['', Validators.email],
    mapsQuery: [''],
    directions: [''],
    certification: [''],
    openingHours: this.fb.array<ReturnType<SettingsPage['hoursGroup']>>([]),
  });

  private hoursGroup(days = '', hours = '') {
    return this.fb.nonNullable.group({ days: [days], hours: [hours] });
  }

  ngOnInit(): void {
    const s = this.store.settings();
    if (!s) return;
    const { openingHours, testimonials: _t, ...rest } = s;
    this.form.patchValue({
      ...rest,
      whatsappNumber: normaliseWhatsappNumber(rest.whatsappNumber),
      postalCode: String(rest.postalCode ?? ''),
    });
    openingHours.forEach((h) =>
      this.form.controls.openingHours.push(this.hoursGroup(h.days, h.hours)),
    );
  }

  invalid(name: 'shopName' | 'addressLine1' | 'whatsappNumber' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  addHours(): void {
    this.form.controls.openingHours.push(this.hoursGroup());
  }

  async removeHours(i: number): Promise<void> {
    if (
      await this.alerts.confirmDelete('Remove this row?', 'The opening hours row will be removed.')
    ) {
      this.form.controls.openingHours.removeAt(i);
    }
  }

  private toSettings(): ShopSettings | null {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.error('Please check the form', 'Some fields are missing or invalid.');
      return null;
    }
    const v = this.form.getRawValue();
    return {
      ...this.store.settings()!,
      ...v,
      state: v.state ?? '',
      postalCode: String(v.postalCode ?? ''),
      whatsappNumber: normaliseWhatsappNumber(String(v.whatsappNumber ?? '')),
      openingHours: v.openingHours.filter((h) => h.days.trim() || h.hours.trim()),
    };
  }

  async save(): Promise<void> {
    const s = this.toSettings();
    if (!s) return;
    if (
      !(await this.alerts.confirm(
        'Update shop settings?',
        'Contact details and opening hours will be updated on the website preview.',
      ))
    )
      return;
    this.store.saveDraft('settings', s);
    void this.alerts.success('Settings updated');
  }

  download(): void {
    const s = this.toSettings();
    if (!s) return;
    downloadJson('settings.json', s);
    void this.alerts.toast('settings.json downloaded');
  }
}

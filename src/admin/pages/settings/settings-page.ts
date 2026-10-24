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
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgSelectComponent, NumbersOnlyDirective, AdminCard],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="row g-3">
        <div class="col-xl-6">
          <admin-card heading="Shop" subtitle="Name and tagline" icon="◆">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="s-name">Shop name <span class="text-danger">*</span></label>
                <input id="s-name" class="form-control" formControlName="shopName" [class.is-invalid]="invalid('shopName')" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="s-tag">Tagline</label>
                <input id="s-tag" class="form-control" formControlName="tagline" />
              </div>
            </div>
          </admin-card>

          <admin-card heading="Contact" subtitle="Used for WhatsApp enquiries and call buttons" icon="✆">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="s-wa">WhatsApp number</label>
                <input id="s-wa" class="form-control" type="text" formControlName="whatsappNumber" appNumbersOnly [decimals]="0" [class.is-invalid]="invalid('whatsappNumber')" placeholder="919876543210" />
                <div class="form-text">Digits only, with country code (91 for India).</div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="s-phone">Phone</label>
                <input id="s-phone" class="form-control" formControlName="phone" placeholder="+91 98765 43210" />
              </div>
              <div class="col-12">
                <label class="form-label" for="s-email">Email</label>
                <input id="s-email" class="form-control" type="email" formControlName="email" [class.is-invalid]="invalid('email')" />
              </div>
            </div>
          </admin-card>

          <admin-card heading="Certification" subtitle="Shown on the home and about pages" icon="✓">
            <textarea class="form-control" rows="2" formControlName="certification" aria-label="Certification statement"></textarea>
            <div card-footer>Only enter verified information, e.g. your hallmarking registration. Leave empty to hide.</div>
          </admin-card>
        </div>

        <div class="col-xl-6">
          <admin-card heading="Address" subtitle="Shown in the footer, contact page and map" icon="⌖">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="s-a1">Address line 1 <span class="text-danger">*</span></label>
                <input id="s-a1" class="form-control" formControlName="addressLine1" [class.is-invalid]="invalid('addressLine1')" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="s-a2">Address line 2</label>
                <input id="s-a2" class="form-control" formControlName="addressLine2" />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="s-city">City / town</label>
                <input id="s-city" class="form-control" formControlName="city" />
              </div>
              <div class="col-md-5">
                <label class="form-label" for="s-state">State</label>
                <ng-select labelForId="s-state" formControlName="state" [items]="states" placeholder="Choose state" />
              </div>
              <div class="col-md-3">
                <label class="form-label" for="s-pin">PIN code</label>
                <input id="s-pin" class="form-control" type="text" maxlength="6" formControlName="postalCode" appNumbersOnly [decimals]="0" />
              </div>
              <div class="col-12">
                <label class="form-label" for="s-map">Google Maps search text</label>
                <input id="s-map" class="form-control" formControlName="mapsQuery" />
              </div>
              <div class="col-12">
                <label class="form-label" for="s-dir">Directions to the showroom</label>
                <textarea id="s-dir" class="form-control" rows="2" formControlName="directions" placeholder="e.g. Opposite the bus stand, next to …"></textarea>
              </div>
            </div>
          </admin-card>

          <admin-card heading="Opening hours" icon="◷">
            <button card-actions type="button" class="btn btn-sm btn-outline-primary" (click)="addHours()">+ Add row</button>
            <div formArrayName="openingHours" class="vstack gap-2">
              @for (row of form.controls.openingHours.controls; track row; let i = $index) {
                <div [formGroupName]="i" class="input-group">
                  <input class="form-control" formControlName="days" placeholder="Monday – Saturday" aria-label="Days" />
                  <input class="form-control" formControlName="hours" placeholder="10:00 AM – 8:30 PM" aria-label="Hours" />
                  <button type="button" class="btn btn-outline-danger" (click)="removeHours(i)" aria-label="Remove row">✕</button>
                </div>
              } @empty {
                <p class="text-body-secondary mb-0">No opening hours added.</p>
              }
            </div>
          </admin-card>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button type="submit" class="btn btn-primary">Update settings</button>
        <button type="button" class="btn btn-outline-secondary" (click)="download()">Download settings.json</button>
      </div>
    </form>
  `,
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
    this.form.patchValue({ ...rest, whatsappNumber: normaliseWhatsappNumber(rest.whatsappNumber), postalCode: String(rest.postalCode ?? '') });
    openingHours.forEach((h) => this.form.controls.openingHours.push(this.hoursGroup(h.days, h.hours)));
  }

  invalid(name: 'shopName' | 'addressLine1' | 'whatsappNumber' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  addHours(): void {
    this.form.controls.openingHours.push(this.hoursGroup());
  }

  async removeHours(i: number): Promise<void> {
    if (await this.alerts.confirmDelete('Remove this row?', 'The opening hours row will be removed.')) {
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
    if (!(await this.alerts.confirm('Update shop settings?', 'Contact details and opening hours will be updated on the website preview.'))) return;
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

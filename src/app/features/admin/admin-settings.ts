import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShopSettings } from '../../core/models';
import { ContentStore } from '../../core/services/content-store';
import { normaliseWhatsappNumber } from '../../core/services/whatsapp.service';
import { downloadJson } from '../../core/utils/download';

@Component({
  selector: 'app-admin-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="admin-head">
      <div>
        <h1>Shop settings</h1>
        <p>Contact details, WhatsApp number and opening hours used across the website.</p>
      </div>
    </div>

    <form [formGroup]="form" (ngSubmit)="save()">
      <section class="admin-panel">
        <h2>Shop</h2>
        <div class="admin-grid">
          <label class="field"><span>Shop name</span><input class="input" formControlName="shopName" /></label>
          <label class="field"><span>Tagline</span><input class="input" formControlName="tagline" /></label>
        </div>
      </section>

      <section class="admin-panel">
        <h2>Address</h2>
        <div class="admin-grid">
          <label class="field"><span>Address line 1</span><input class="input" formControlName="addressLine1" /></label>
          <label class="field"><span>Address line 2</span><input class="input" formControlName="addressLine2" /></label>
          <label class="field"><span>City / town</span><input class="input" formControlName="city" /></label>
          <label class="field"><span>State</span><input class="input" formControlName="state" /></label>
          <label class="field"><span>PIN code</span><input class="input" formControlName="postalCode" inputmode="numeric" /></label>
          <label class="field"><span>Google Maps search text</span><input class="input" formControlName="mapsQuery" /></label>
          <label class="field" style="grid-column: 1 / -1">
            <span>Directions to the showroom</span>
            <textarea class="input" formControlName="directions" rows="3" placeholder="e.g. Opposite the bus stand, next to …"></textarea>
          </label>
        </div>
      </section>

      <section class="admin-panel">
        <h2>Contact</h2>
        <div class="admin-grid">
          <label class="field">
            <span>WhatsApp number</span>
            <input class="input" formControlName="whatsappNumber" placeholder="91 98765 43210" inputmode="tel" />
            <span class="admin-help">Include the country code (91 for India). Spaces and + are removed automatically.</span>
            @if (form.controls.whatsappNumber.invalid) { <span class="admin-invalid">Enter 10–15 digits including country code.</span> }
          </label>
          <label class="field"><span>Phone</span><input class="input" formControlName="phone" inputmode="tel" /></label>
          <label class="field"><span>Email</span><input class="input" type="email" formControlName="email" /></label>
        </div>
      </section>

      <section class="admin-panel">
        <h2>Opening hours</h2>
        <div formArrayName="openingHours" style="display: grid; gap: 0.75rem">
          @for (row of hours.controls; track row; let i = $index) {
            <div [formGroupName]="i" class="admin-actions">
              <input class="input" formControlName="days" placeholder="Monday – Saturday" style="flex: 1 1 200px" />
              <input class="input" formControlName="hours" placeholder="10:00 AM – 8:30 PM" style="flex: 1 1 200px" />
              <button type="button" class="btn btn-danger btn-sm" (click)="hours.removeAt(i)">Remove</button>
            </div>
          }
        </div>
        <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.75rem" (click)="addHours()">+ Add row</button>
      </section>

      <section class="admin-panel">
        <h2>Certification</h2>
        <label class="field">
          <span>Purity / hallmark statement</span>
          <textarea class="input" formControlName="certification" rows="2"></textarea>
          <span class="admin-help">Only enter verified information, e.g. your hallmarking registration. Leave empty to hide.</span>
        </label>
      </section>

      @if (error()) { <p class="admin-invalid" role="alert">{{ error() }}</p> }
      <div class="admin-actions">
        <button type="submit" class="btn btn-gold btn-sm">Save &amp; preview</button>
        <button type="button" class="btn btn-outline btn-sm" (click)="download()">Download settings.json</button>
      </div>
    </form>
  `,
})
export class AdminSettings implements OnInit {
  private readonly store = inject(ContentStore);
  private readonly fb = inject(FormBuilder);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    shopName: ['', Validators.required],
    tagline: [''],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: [''],
    state: [''],
    postalCode: [''],
    phone: [''],
    whatsappNumber: ['', Validators.pattern(/^\+?[\d\s()-]{10,20}$/)],
    email: ['', Validators.email],
    mapsQuery: [''],
    directions: [''],
    certification: [''],
    openingHours: this.fb.array<ReturnType<AdminSettings['hoursGroup']>>([]),
  });

  get hours(): FormArray {
    return this.form.controls.openingHours;
  }

  private hoursGroup(days = '', hours = '') {
    return this.fb.nonNullable.group({ days: [days], hours: [hours] });
  }

  ngOnInit(): void {
    const s = this.store.settings();
    if (!s) return;
    const { openingHours, testimonials: _t, ...rest } = s;
    this.form.patchValue(rest);
    openingHours.forEach((h) => this.form.controls.openingHours.push(this.hoursGroup(h.days, h.hours)));
  }

  addHours(): void {
    this.form.controls.openingHours.push(this.hoursGroup());
  }

  private toSettings(): ShopSettings | null {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fix the highlighted fields.');
      return null;
    }
    this.error.set('');
    const v = this.form.getRawValue();
    return {
      ...this.store.settings()!,
      ...v,
      whatsappNumber: normaliseWhatsappNumber(v.whatsappNumber),
      openingHours: v.openingHours.filter((h) => h.days.trim() || h.hours.trim()),
    };
  }

  save(): void {
    const s = this.toSettings();
    if (s) this.store.saveDraft('settings', s);
  }

  download(): void {
    const s = this.toSettings();
    if (s) downloadJson('settings.json', s);
  }
}

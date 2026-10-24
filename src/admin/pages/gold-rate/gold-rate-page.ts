import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateStruct, NgbInputDatepicker, NgbTimeStruct, NgbTimepicker } from '@ng-bootstrap/ng-bootstrap';
import { GoldRateData } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { downloadJson } from '../../../app/core/utils/download';
import { eightGramRate, formatInr, isValidRate } from '../../../app/core/utils/gold-math';
import { AdminAlerts } from '../../core/alerts.service';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';

const toNumber = (v: string | number | null): number | null => (v === null || v === '' ? null : Number(v));

@Component({
  selector: 'app-gold-rate-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, NgbInputDatepicker, NgbTimepicker, NumbersOnlyDirective, AdminCard],
  template: `
    <div class="row g-3">
      <div class="col-xl-7">
        <admin-card heading="Update today's rate" subtitle="Enter per-gram rates in rupees. 8-gram rates are calculated automatically." icon="₹">
          <form [formGroup]="form" (ngSubmit)="save()" novalidate>
            <div class="row g-3">
              <div class="col-sm-6">
                <label class="form-label" for="r22">22K gold, per gram <span class="text-danger">*</span></label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text">₹</span>
                  <input id="r22" class="form-control" type="text" formControlName="rate22k" appNumbersOnly [decimals]="2" [class.is-invalid]="invalid('rate22k')" placeholder="0.00" />
                </div>
                @if (invalid('rate22k')) { <div class="invalid-feedback d-block">Enter a rate greater than zero.</div> }
              </div>
              <div class="col-sm-6">
                <label class="form-label" for="r24">24K gold, per gram <span class="text-danger">*</span></label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text">₹</span>
                  <input id="r24" class="form-control" type="text" formControlName="rate24k" appNumbersOnly [decimals]="2" [class.is-invalid]="invalid('rate24k')" placeholder="0.00" />
                </div>
                @if (invalid('rate24k')) { <div class="invalid-feedback d-block">Enter a rate greater than zero.</div> }
              </div>
              <div class="col-sm-6">
                <label class="form-label" for="rdate">Effective date</label>
                <div class="input-group">
                  <input id="rdate" class="form-control" placeholder="dd-mm-yyyy" formControlName="date" ngbDatepicker #dp="ngbDatepicker" [maxDate]="today" readonly (click)="dp.toggle()" />
                  <button class="btn btn-outline-secondary" type="button" (click)="dp.toggle()" aria-label="Open calendar">📅</button>
                </div>
              </div>
              <div class="col-sm-6">
                <label class="form-label">Effective time</label>
                <ngb-timepicker formControlName="time" [meridian]="true" [spinners]="false" size="small" />
              </div>
            </div>

            @if (preview(); as p) {
              <div class="table-responsive mt-4">
                <table class="table table-bordered align-middle mb-0">
                  <thead class="table-light"><tr><th>Gold type</th><th class="text-end">Price</th></tr></thead>
                  <tbody>
                    <tr><td>22K Gold — 1 Gram</td><td class="text-end fw-semibold">{{ fmt(p.r22) }}</td></tr>
                    <tr><td>22K Gold — 8 Grams</td><td class="text-end fw-semibold">{{ fmt(p.r22x8) }}</td></tr>
                    <tr><td>24K Gold — 1 Gram</td><td class="text-end fw-semibold">{{ fmt(p.r24) }}</td></tr>
                    <tr><td>24K Gold — 8 Grams</td><td class="text-end fw-semibold">{{ fmt(p.r24x8) }}</td></tr>
                  </tbody>
                </table>
              </div>
              @if (p.r22 >= p.r24) {
                <div class="alert alert-warning py-2 mt-3 mb-0">Check the numbers: 22K is usually cheaper than 24K.</div>
              }
            }

            <div class="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" class="btn btn-primary">Update gold rate</button>
              <button type="button" class="btn btn-outline-secondary" (click)="download()">Download gold-rate.json</button>
            </div>
          </form>
          <div card-footer>
            To make the rate live for everyone, download gold-rate.json, replace <code>public/data/gold-rate.json</code> and redeploy.
            Rates older than 24 hours are labelled "Delayed" on the website.
          </div>
        </admin-card>
      </div>

      <div class="col-xl-5">
        <admin-card [heading]="store.isDraft('goldRate') ? 'Current rate (draft)' : 'Current rate (published)'" icon="◷">
          @if (current().updatedAt) {
            <div class="row g-2">
              <div class="col-6">
                <div class="p-3 rounded-3 bg-body-tertiary">
                  <div class="small text-body-secondary">22K / gram</div>
                  <div class="fs-4 fw-bold text-primary">{{ fmt(current().rate22k) }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="p-3 rounded-3 bg-body-tertiary">
                  <div class="small text-body-secondary">24K / gram</div>
                  <div class="fs-4 fw-bold text-primary">{{ fmt(current().rate24k) }}</div>
                </div>
              </div>
            </div>
            <p class="small text-body-secondary mt-3 mb-0">Updated {{ current().updatedAt | date: 'd MMM y, h:mm a' }}</p>
          } @else {
            <p class="text-body-secondary mb-0">No rate published yet. The website shows "Rate unavailable".</p>
          }
        </admin-card>
      </div>
    </div>
  `,
})
export class GoldRatePage {
  readonly store = inject(ContentStore);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);

  readonly current = this.store.goldRateFile;
  readonly submitted = signal(false);

  private readonly now = new Date();
  readonly today: NgbDateStruct = { year: this.now.getFullYear(), month: this.now.getMonth() + 1, day: this.now.getDate() };

  readonly form = this.fb.group({
    rate22k: this.fb.control<string | number | null>(this.current().rate22k, [Validators.required, Validators.min(0.01)]),
    rate24k: this.fb.control<string | number | null>(this.current().rate24k, [Validators.required, Validators.min(0.01)]),
    date: this.fb.nonNullable.control<NgbDateStruct>(this.today, Validators.required),
    time: this.fb.nonNullable.control<NgbTimeStruct>({ hour: this.now.getHours(), minute: this.now.getMinutes(), second: 0 }, Validators.required),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly preview = computed(() => {
    const r22 = toNumber(this.value().rate22k ?? null);
    const r24 = toNumber(this.value().rate24k ?? null);
    if (!isValidRate(r22) || !isValidRate(r24)) return null;
    return { r22, r24, r22x8: eightGramRate(r22), r24x8: eightGramRate(r24) };
  });

  fmt(v: number | null): string {
    return v === null ? '—' : formatInr(v);
  }

  invalid(name: 'rate22k' | 'rate24k'): boolean {
    const c = this.form.controls[name];
    return (c.touched || this.submitted()) && !isValidRate(toNumber(c.value));
  }

  private toData(): GoldRateData | null {
    const { rate22k, rate24k, date, time } = this.form.getRawValue();
    const r22 = toNumber(rate22k);
    const r24 = toNumber(rate24k);
    if (!isValidRate(r22) || !isValidRate(r24) || !date || !time) return null;
    const when = new Date(date.year, date.month - 1, date.day, time.hour, time.minute);
    return { rate22k: Math.round(r22 * 100) / 100, rate24k: Math.round(r24 * 100) / 100, updatedAt: when.toISOString() };
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    const data = this.toData();
    if (!data) {
      void this.alerts.error('Check the rates', 'Enter both rates as numbers greater than zero.');
      return;
    }
    const ok = await this.alerts.confirm(
      'Update gold rate?',
      `22K: ${formatInr(data.rate22k!)} / g  •  24K: ${formatInr(data.rate24k!)} / g`,
    );
    if (!ok) return;
    this.store.saveDraft('goldRate', data);
    void this.alerts.success('Gold rate updated', 'Preview it on the website, then publish from the Publish page.');
  }

  download(): void {
    const data = this.toData() ?? this.current();
    if (!isValidRate(data.rate22k) || !isValidRate(data.rate24k)) {
      void this.alerts.error('Nothing to download', 'Enter both rates first.');
      return;
    }
    downloadJson('gold-rate.json', data);
    void this.alerts.toast('gold-rate.json downloaded');
  }
}

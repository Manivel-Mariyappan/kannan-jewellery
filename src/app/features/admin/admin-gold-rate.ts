import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GoldRateData } from '../../core/models';
import { ContentStore } from '../../core/services/content-store';
import { downloadJson } from '../../core/utils/download';
import { eightGramRate, formatInr, isValidRate } from '../../core/utils/gold-math';

/** datetime-local value for "now" in the visitor's timezone. */
function localNow(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

@Component({
  selector: 'app-admin-gold-rate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <div class="admin-head">
      <div>
        <h1>Gold rate</h1>
        <p>Enter today's per-gram rates in rupees. 8-gram rates are calculated automatically.</p>
      </div>
    </div>

    <section class="admin-panel">
      <h2>Currently {{ store.isDraft('goldRate') ? 'previewing (draft)' : 'published' }}</h2>
      @if (current().updatedAt) {
        <p>22K: <strong>{{ fmt(current().rate22k) }}</strong> / g · 24K: <strong>{{ fmt(current().rate24k) }}</strong> / g
          · updated {{ current().updatedAt | date: 'd MMM y, h:mm a' }}</p>
      } @else {
        <p class="admin-muted">No rate published yet. The website shows "Rate unavailable".</p>
      }
    </section>

    <form class="admin-panel" [formGroup]="form" (ngSubmit)="save()">
      <h2>Update rate</h2>
      <div class="admin-grid">
        <label class="field">
          <span>22K — per gram (₹)</span>
          <input class="input" type="number" step="0.01" min="1" formControlName="rate22k" inputmode="decimal" />
        </label>
        <label class="field">
          <span>24K — per gram (₹)</span>
          <input class="input" type="number" step="0.01" min="1" formControlName="rate24k" inputmode="decimal" />
        </label>
        <label class="field">
          <span>Rate effective from</span>
          <input class="input" type="datetime-local" formControlName="updatedAt" />
        </label>
      </div>

      @if (preview(); as p) {
        <table class="admin-table" style="margin-top: 1.25rem; max-width: 520px">
          <thead><tr><th>Gold type</th><th>Price</th></tr></thead>
          <tbody>
            <tr><td>22K Gold — 1 Gram</td><td>{{ fmt(p.r22) }}</td></tr>
            <tr><td>22K Gold — 8 Grams</td><td>{{ fmt(p.r22x8) }}</td></tr>
            <tr><td>24K Gold — 1 Gram</td><td>{{ fmt(p.r24) }}</td></tr>
            <tr><td>24K Gold — 8 Grams</td><td>{{ fmt(p.r24x8) }}</td></tr>
          </tbody>
        </table>
        @if (p.r22 >= p.r24) {
          <p class="admin-invalid">Check the numbers: 22K is usually cheaper than 24K.</p>
        }
      }

      @if (error()) { <p class="admin-invalid" role="alert">{{ error() }}</p> }
      <div class="admin-actions" style="margin-top: 1.25rem">
        <button type="submit" class="btn btn-gold btn-sm">Save &amp; preview on website</button>
        <button type="button" class="btn btn-outline btn-sm" (click)="download()">Download gold-rate.json</button>
      </div>
      <p class="admin-help">
        To make the rate live for everyone: download gold-rate.json, replace <code>public/data/gold-rate.json</code> and redeploy
        (see <a routerLink="/admin/publish">Publish</a>). Rates older than 24 hours are labelled "delayed" on the website.
      </p>
    </form>
  `,
})
export class AdminGoldRate {
  readonly store = inject(ContentStore);
  private readonly fb = inject(FormBuilder);

  readonly current = this.store.goldRateFile;
  readonly error = signal('');

  readonly form = this.fb.group({
    rate22k: this.fb.control<number | null>(this.current().rate22k, [Validators.required, Validators.min(1)]),
    rate24k: this.fb.control<number | null>(this.current().rate24k, [Validators.required, Validators.min(1)]),
    updatedAt: this.fb.nonNullable.control(localNow(), Validators.required),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly preview = computed(() => {
    const { rate22k, rate24k } = this.value();
    if (!isValidRate(rate22k) || !isValidRate(rate24k)) return null;
    return { r22: rate22k, r24: rate24k, r22x8: eightGramRate(rate22k), r24x8: eightGramRate(rate24k) };
  });

  fmt(v: number | null): string {
    return v === null ? '—' : formatInr(v);
  }

  private toData(): GoldRateData | null {
    const { rate22k, rate24k, updatedAt } = this.form.getRawValue();
    if (!isValidRate(rate22k) || !isValidRate(rate24k) || !updatedAt) return null;
    return {
      rate22k: Math.round(rate22k * 100) / 100,
      rate24k: Math.round(rate24k * 100) / 100,
      updatedAt: new Date(updatedAt).toISOString(),
    };
  }

  save(): void {
    const data = this.toData();
    if (!data) {
      this.error.set('Enter both rates as positive numbers and a date.');
      return;
    }
    this.error.set('');
    this.store.saveDraft('goldRate', data);
  }

  download(): void {
    const data = this.toData() ?? this.current();
    if (!isValidRate(data.rate22k) || !isValidRate(data.rate24k)) {
      this.error.set('Enter both rates before downloading.');
      return;
    }
    downloadJson('gold-rate.json', data);
  }
}

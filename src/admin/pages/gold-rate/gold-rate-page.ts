import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NgbDateStruct,
  NgbInputDatepicker,
  NgbTimeStruct,
  NgbTimepicker,
} from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { GoldRateData } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { downloadJson } from '../../../app/core/utils/download';
import { eightGramRate, formatInr, isValidRate } from '../../../app/core/utils/gold-math';
import { AdminAuthService } from '../../core/admin-auth.service';
import { AdminDataService } from '../../core/admin-data.service';
import { GoldRateHistoryEntry } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import { newId } from '../../core/local-collection';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';
import { adminGridTheme, formatDateTime } from '../../shared/grid';
import { UiOnlyNote } from '../../shared/ui-only-note';

const toNumber = (v: string | number | null): number | null =>
  v === null || v === '' ? null : Number(v);
const round2 = (v: number) => Math.round(v * 100) / 100;

@Component({
  selector: 'app-gold-rate-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NgbInputDatepicker,
    NgbTimepicker,
    NumbersOnlyDirective,
    AdminCard,
    AgGridAngular,
    UiOnlyNote,
  ],
  templateUrl: './gold-rate-page.html',
})
export class GoldRatePage {
  readonly store = inject(ContentStore);
  readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);
  private readonly auth = inject(AdminAuthService);

  readonly theme = adminGridTheme;
  readonly current = this.store.goldRateFile;
  readonly submitted = signal(false);

  private readonly now = new Date();
  readonly today: NgbDateStruct = {
    year: this.now.getFullYear(),
    month: this.now.getMonth() + 1,
    day: this.now.getDate(),
  };

  readonly form = this.fb.group({
    rate22k: this.fb.control<string | number | null>(this.current().rate22k, [
      Validators.required,
      Validators.min(0.01),
    ]),
    rate24k: this.fb.control<string | number | null>(this.current().rate24k, [
      Validators.required,
      Validators.min(0.01),
    ]),
    rate18k: this.fb.control<string | number | null>(null),
    silver: this.fb.control<string | number | null>(null),
    date: this.fb.nonNullable.control<NgbDateStruct>(this.today, Validators.required),
    time: this.fb.nonNullable.control<NgbTimeStruct>(
      { hour: this.now.getHours(), minute: this.now.getMinutes(), second: 0 },
      Validators.required,
    ),
    note: this.fb.nonNullable.control(''),
  });

  readonly historyColumns: ColDef<GoldRateHistoryEntry>[] = [
    {
      headerName: 'Effective',
      field: 'effectiveAt',
      width: 200,
      sort: 'desc',
      valueFormatter: (p) => formatDateTime(p.value as string),
    },
    {
      headerName: '22K / g',
      field: 'rate22k',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p) => this.fmt(p.value as number),
    },
    {
      headerName: '24K / g',
      field: 'rate24k',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p) => this.fmt(p.value as number),
    },
    {
      headerName: '18K / g',
      field: 'rate18k',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p) => this.fmt(p.value as number | null),
    },
    {
      headerName: 'Silver / g',
      field: 'silver',
      width: 120,
      type: 'rightAligned',
      valueFormatter: (p) => this.fmt(p.value as number | null),
    },
    { headerName: 'Updated by', field: 'updatedBy', width: 140 },
    { headerName: 'Note', field: 'note', flex: 1, minWidth: 180 },
  ];

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  readonly preview = computed(() => {
    const r22 = toNumber(this.value().rate22k ?? null);
    const r24 = toNumber(this.value().rate24k ?? null);
    if (!isValidRate(r22) || !isValidRate(r24)) return null;
    return { r22, r24, r22x8: eightGramRate(r22), r24x8: eightGramRate(r24) };
  });

  fmt(v: number | null | undefined): string {
    return v === null || v === undefined ? '—' : formatInr(v);
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
    return { rate22k: round2(r22), rate24k: round2(r24), updatedAt: when.toISOString() };
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

    const { rate18k, silver, note } = this.form.getRawValue();
    const optional = (v: string | number | null) => {
      const n = toNumber(v);
      return isValidRate(n) ? round2(n) : null;
    };
    this.data.goldRateHistory.upsert({
      id: newId('rate'),
      effectiveAt: data.updatedAt!,
      rate22k: data.rate22k!,
      rate24k: data.rate24k!,
      rate18k: optional(rate18k),
      silver: optional(silver),
      updatedBy: this.auth.username() ?? '',
      note: note.trim(),
    });
    void this.alerts.success(
      'Gold rate updated',
      'Preview it on the website, then publish from the Publish page.',
    );
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

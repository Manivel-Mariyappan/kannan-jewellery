import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { GoldRateData, GoldRateStatus } from '../models';
import { eightGramRate, goldRateStatus, isValidRate } from '../utils/gold-math';
import { ContentStore } from './content-store';

export interface GoldRateRow {
  label: string;
  purity: '22K' | '24K';
  grams: 1 | 8;
  price: number;
}

export interface GoldRateView {
  status: GoldRateStatus;
  source: 'api' | 'store';
  rows: GoldRateRow[];
  updatedAt: Date | null;
}

function rateRow(purity: '22K' | '24K', grams: 1 | 8, price: number): GoldRateRow {
  const label = `${purity} Gold — ${grams} ${grams === 1 ? 'Gram' : 'Grams'}`;
  return { label, purity, grams, price };
}

@Injectable({ providedIn: 'root' })
export class GoldRateService {
  private readonly store = inject(ContentStore);
  private readonly http = inject(HttpClient);

  // null when no live endpoint is configured or it failed
  private readonly apiRate = signal<GoldRateData | null>(null);
  private readonly now = signal(new Date());

  constructor() {
    if (APP_CONFIG.goldRateApiUrl) void this.refreshFromApi();
    // Recheck every few minutes so a page left open still shows "Delayed" when it should.
    setInterval(() => this.now.set(new Date()), 5 * 60_000);
  }

  readonly view = computed<GoldRateView>(() => {
    const api = this.apiRate();
    const data = api ?? this.store.goldRateFile();
    const status = goldRateStatus(data, this.now(), APP_CONFIG.goldRateStaleHours);

    let rows: GoldRateRow[] = [];
    if (status !== 'unavailable') {
      // Both rates are valid numbers here, otherwise the status would be 'unavailable'.
      const rate22k = data.rate22k as number;
      const rate24k = data.rate24k as number;
      rows = [
        rateRow('22K', 1, rate22k),
        rateRow('22K', 8, eightGramRate(rate22k)),
        rateRow('24K', 1, rate24k),
        rateRow('24K', 8, eightGramRate(rate24k)),
      ];
    }

    return {
      status,
      source: api ? 'api' : 'store',
      rows,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
    };
  });

  private async refreshFromApi(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<GoldRateData>(APP_CONFIG.goldRateApiUrl));
      if (isValidRate(data.rate22k) && isValidRate(data.rate24k)) this.apiRate.set(data);
    } catch (err) {
      // Fall back to gold-rate.json.
      console.warn('[gold-rate] live endpoint failed, using published rate', err);
    }
  }
}

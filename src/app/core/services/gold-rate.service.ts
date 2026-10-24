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
  /** Where the numbers came from: the optional live API or the store's published file. */
  source: 'api' | 'store';
  rows: GoldRateRow[];
  updatedAt: Date | null;
}

@Injectable({ providedIn: 'root' })
export class GoldRateService {
  private readonly store = inject(ContentStore);
  private readonly http = inject(HttpClient);

  /** Rate from the optional live endpoint; `null` when not configured or failing. */
  private readonly apiRate = signal<GoldRateData | null>(null);
  private readonly now = signal(new Date());

  constructor() {
    if (APP_CONFIG.goldRateApiUrl) void this.refreshFromApi();
    // Re-evaluate staleness periodically for visitors who keep the page open.
    setInterval(() => this.now.set(new Date()), 5 * 60_000);
  }

  readonly view = computed<GoldRateView>(() => {
    const api = this.apiRate();
    const data = api ?? this.store.goldRateFile();
    const status = goldRateStatus(data, this.now(), APP_CONFIG.goldRateStaleHours);
    const rows: GoldRateRow[] =
      status === 'unavailable'
        ? []
        : [
            { label: '22K Gold — 1 Gram', purity: '22K', grams: 1, price: data.rate22k! },
            { label: '22K Gold — 8 Grams', purity: '22K', grams: 8, price: eightGramRate(data.rate22k!) },
            { label: '24K Gold — 1 Gram', purity: '24K', grams: 1, price: data.rate24k! },
            { label: '24K Gold — 8 Grams', purity: '24K', grams: 8, price: eightGramRate(data.rate24k!) },
          ];
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
      // Fall back to the store's published rate; its own timestamp decides how it is labelled.
      console.warn('[gold-rate] live endpoint failed, using published rate', err);
    }
  }
}

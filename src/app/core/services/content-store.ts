import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { GoldRateData, Product, ShopSettings } from '../models';

type LoadState = 'loading' | 'ready' | 'error';

const DRAFT_KEYS = {
  products: 'kj.draft.products',
  goldRate: 'kj.draft.goldRate',
  settings: 'kj.draft.settings',
} as const;
export type DraftKind = keyof typeof DRAFT_KEYS;

function readDraft<T>(kind: DraftKind): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEYS[kind]);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Single source of truth for site content, loaded from the JSON files in `public/data/`.
 *
 * Admin edits are saved as *drafts* in this browser's localStorage so the owner can preview
 * them on the real pages. Drafts are never visible to other visitors: publishing means
 * downloading the JSON from the admin portal and replacing the files in `public/data/`.
 */
@Injectable({ providedIn: 'root' })
export class ContentStore {
  private readonly http = inject(HttpClient);

  readonly state = signal<LoadState>('loading');

  private readonly publishedProducts = signal<Product[]>([]);
  private readonly publishedGoldRate = signal<GoldRateData>({ rate22k: null, rate24k: null, updatedAt: null });
  private readonly publishedSettings = signal<ShopSettings | null>(null);

  private readonly drafts = signal({
    products: readDraft<Product[]>('products'),
    goldRate: readDraft<GoldRateData>('goldRate'),
    settings: readDraft<ShopSettings>('settings'),
  });

  readonly products = computed(() => this.drafts().products ?? this.publishedProducts());
  readonly goldRateFile = computed(() => this.drafts().goldRate ?? this.publishedGoldRate());
  readonly settings = computed(() => this.drafts().settings ?? this.publishedSettings());

  readonly hasDrafts = computed(() => Object.values(this.drafts()).some((d) => d !== null));
  readonly draftKinds = computed(() =>
    (Object.keys(DRAFT_KEYS) as DraftKind[]).filter((k) => this.drafts()[k] !== null),
  );

  private loading?: Promise<void>;

  constructor() {
    void this.load();
  }

  load(): Promise<void> {
    this.loading ??= this.fetchAll().finally(() => (this.loading = undefined));
    return this.loading;
  }

  private async fetchAll(): Promise<void> {
    this.state.set('loading');
    try {
      const { products, goldRate, settings } = APP_CONFIG.dataUrls;
      // Bypass HTTP caches so a freshly deployed rate shows up immediately.
      const bust = `?v=${Date.now()}`;
      const [p, g, s] = await Promise.all([
        firstValueFrom(this.http.get<Product[]>(products + bust)),
        firstValueFrom(this.http.get<GoldRateData>(goldRate + bust)),
        firstValueFrom(this.http.get<ShopSettings>(settings + bust)),
      ]);
      this.publishedProducts.set(p);
      this.publishedGoldRate.set(g);
      this.publishedSettings.set(s);
      this.state.set('ready');
    } catch (err) {
      console.error('[content] failed to load site data', err);
      this.state.set('error');
    }
  }

  // ---- Draft management (admin portal) ----

  saveDraft<K extends DraftKind>(kind: K, value: K extends 'products' ? Product[] : K extends 'goldRate' ? GoldRateData : ShopSettings): void {
    try {
      localStorage.setItem(DRAFT_KEYS[kind], JSON.stringify(value));
    } catch (err) {
      // Usually QuotaExceededError from large uploaded images.
      throw new Error('This browser could not store the draft. Uploaded photos may be too large — use image paths instead.', { cause: err });
    }
    this.drafts.update((d) => ({ ...d, [kind]: value }));
  }

  discardDraft(kind: DraftKind): void {
    try {
      localStorage.removeItem(DRAFT_KEYS[kind]);
    } catch {
      /* storage unavailable: nothing to discard */
    }
    this.drafts.update((d) => ({ ...d, [kind]: null }));
  }

  isDraft(kind: DraftKind): boolean {
    return this.drafts()[kind] !== null;
  }
}

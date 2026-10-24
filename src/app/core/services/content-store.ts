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

interface DraftValues {
  products: Product[];
  goldRate: GoldRateData;
  settings: ShopSettings;
}

function readDraft<T>(kind: DraftKind): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEYS[kind]);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Loads the site content from public/data/*.json.
// Admin edits are saved as drafts in localStorage, so only that browser sees them until the
// downloaded JSON files are deployed.
@Injectable({ providedIn: 'root' })
export class ContentStore {
  private readonly http = inject(HttpClient);

  readonly state = signal<LoadState>('loading');

  private readonly publishedProducts = signal<Product[]>([]);
  private readonly publishedGoldRate = signal<GoldRateData>({
    rate22k: null,
    rate24k: null,
    updatedAt: null,
  });
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
      // Skip the cache so a newly deployed gold rate shows up straight away.
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

  saveDraft<K extends DraftKind>(kind: K, value: DraftValues[K]): void {
    try {
      localStorage.setItem(DRAFT_KEYS[kind], JSON.stringify(value));
    } catch (err) {
      // Usually the storage quota, when too many photos are uploaded.
      throw new Error(
        'This browser could not store the draft. Uploaded photos may be too large, so add them by path instead.',
        { cause: err },
      );
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

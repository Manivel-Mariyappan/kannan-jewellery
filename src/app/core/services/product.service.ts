import { Injectable, computed, inject } from '@angular/core';
import { categoryBySlug } from '../config/categories';
import { Product, Purity } from '../models';
import { ContentStore } from './content-store';

export type SortKey = 'newest' | 'name' | 'weight-asc' | 'weight-desc';

export interface ProductQuery {
  category?: string | null;
  search?: string | null;
  purity?: Purity | null;
  sort?: SortKey | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly store = inject(ContentStore);

  readonly state = this.store.state;

  // newest first
  readonly published = computed(() =>
    this.store
      .products()
      .filter((p) => p.published)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  readonly featured = computed(() => this.published().filter((p) => p.isFeatured));
  readonly newArrivals = computed(() => this.published().filter((p) => p.isNew));
  readonly bridal = computed(() => this.published().filter((p) => p.categories.includes('bridal')));
  readonly with3d = computed(() => this.published().filter((p) => p.model3d !== null));

  bySlug(slug: string): Product | undefined {
    return this.published().find((p) => p.slug === slug);
  }

  inCategory(slug: string): Product[] {
    const category = categoryBySlug(slug);
    if (category?.virtual === 'new') return this.newArrivals();
    return this.published().filter((p) => p.categories.includes(slug));
  }

  query({ category, search, purity, sort }: ProductQuery): Product[] {
    let items = category ? this.inCategory(category) : this.published();
    if (purity) items = items.filter((p) => p.purity === purity);
    const term = search?.trim().toLowerCase();
    if (term) {
      items = items.filter((p) =>
        [p.name, p.code, p.description, ...p.categories].some((field) =>
          field.toLowerCase().includes(term),
        ),
      );
    }
    const sorted = [...items];
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'weight-asc':
        sorted.sort((a, b) => (a.weightGrams ?? Infinity) - (b.weightGrams ?? Infinity));
        break;
      case 'weight-desc':
        sorted.sort((a, b) => (b.weightGrams ?? -Infinity) - (a.weightGrams ?? -Infinity));
        break;
    }
    return sorted;
  }

  related(product: Product, limit = 4): Product[] {
    return this.published()
      .filter(
        (p) => p.id !== product.id && p.categories.some((c) => product.categories.includes(c)),
      )
      .slice(0, limit);
  }
}

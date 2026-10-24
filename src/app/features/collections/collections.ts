import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CATEGORIES, categoryBySlug } from '../../core/config/categories';
import { Purity } from '../../core/models';
import { ContentStore } from '../../core/services/content-store';
import { ProductService, SortKey } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { Icon } from '../../shared/icons';
import { ProductTile } from '../../shared/product-tile';
import { RevealDirective } from '../../shared/reveal.directive';
import { WhatsappButton } from '../../shared/whatsapp-button';

@Component({
  selector: 'app-collections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon, ProductTile, RevealDirective, WhatsappButton],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class Collections {
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  readonly store = inject(ContentStore);

  /** Route param and query params, bound via withComponentInputBinding(). */
  readonly category = input<string>();
  readonly q = input<string>();
  readonly purity = input<string>();
  readonly sort = input<string>();

  readonly categories = CATEGORIES;
  readonly purities: Purity[] = ['24K', '22K', '18K'];
  readonly sorts: { key: SortKey; label: string }[] = [
    { key: 'newest', label: 'Newest first' },
    { key: 'name', label: 'Name (A–Z)' },
    { key: 'weight-asc', label: 'Weight: light to heavy' },
    { key: 'weight-desc', label: 'Weight: heavy to light' },
  ];

  readonly current = computed(() => categoryBySlug(this.category()));
  readonly title = computed(() => this.current()?.name ?? 'All Collections');

  readonly results = computed(() =>
    this.productService.query({
      category: this.current()?.slug ?? null,
      search: this.q() ?? null,
      purity: this.purities.includes(this.purity() as Purity) ? (this.purity() as Purity) : null,
      sort: (this.sort() as SortKey) ?? 'newest',
    }),
  );

  readonly hasFilters = computed(() => !!(this.q() || this.purity() || (this.sort() && this.sort() !== 'newest')));
  readonly enquiryMessage = computed(() => enquiryMessages.collection(this.title()));

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const c = this.current();
      seo.set({
        title: c ? `${c.name} — Gold Jewellery` : 'Gold Jewellery Collections',
        description: c
          ? `${c.name} at Kannan Jewellery: ${c.blurb.toLowerCase()}. See pieces in 3D and enquire on WhatsApp.`
          : 'Browse gold necklaces, chains, bangles, rings, earrings, bridal, antique and daily-wear jewellery at Kannan Jewellery.',
        path: c ? `/collections/${c.slug}` : '/collections',
      });
    });
  }

  /** Index-based rhythm for the editorial layout: every 7th piece is shown large. */
  span(i: number): string {
    const pos = i % 7;
    return pos === 0 ? 'feature' : pos === 4 ? 'wide' : '';
  }

  updateQuery(params: Record<string, string | null>): void {
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }

  onSearch(value: string): void {
    this.updateQuery({ q: value.trim() || null });
  }

  clearFilters(): void {
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}

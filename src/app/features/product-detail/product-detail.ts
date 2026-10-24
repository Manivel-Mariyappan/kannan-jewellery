import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../../core/config/categories';
import { ContentStore } from '../../core/services/content-store';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { assetUrl } from '../../core/utils/download';
import { Icon } from '../../shared/icons';
import { JewelleryViewer } from '../../shared/jewellery-viewer/jewellery-viewer';
import { ProductTile } from '../../shared/product-tile';
import { RevealDirective } from '../../shared/reveal.directive';
import { WhatsappButton } from '../../shared/whatsapp-button';
import { GoldRatePanel } from '../gold-rate/gold-rate-panel';

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, JewelleryViewer, ProductTile, RevealDirective, WhatsappButton, GoldRatePanel],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly products = inject(ProductService);
  readonly store = inject(ContentStore);

  readonly slug = input.required<string>();

  readonly product = computed(() => this.products.bySlug(this.slug()));
  readonly related = computed(() => {
    const p = this.product();
    return p ? this.products.related(p) : [];
  });

  /** 'model' shows the 3D viewer; a number shows that photograph. Resets when the product changes. */
  readonly view = linkedSignal<'model' | number>(() => (this.product()?.model3d ? 'model' : 0));

  readonly images = computed(() => (this.product()?.images ?? []).map(assetUrl));
  readonly message = computed(() => {
    const p = this.product();
    return p ? enquiryMessages.product(p) : '';
  });
  readonly categoryLinks = computed(() => (this.product()?.categories ?? []).map((slug) => ({ slug, name: categoryName(slug) })));
  readonly phone = computed(() => this.store.settings()?.phone ?? '');

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const p = this.product();
      if (!p) {
        if (this.store.state() !== 'loading') seo.set({ title: 'Piece not found', description: 'This jewellery piece is no longer available.' });
        return;
      }
      const specs = [p.purity, p.weightGrams ? `${p.weightGrams} g` : null].filter(Boolean).join(', ');
      seo.set({
        title: `${p.name} (${p.code})`,
        description: `${p.description} ${specs ? `${specs}.` : ''} Enquire on WhatsApp for today's price.`.trim(),
        path: `/jewellery/${p.slug}`,
        image: p.images[0],
        type: 'product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          sku: p.code,
          description: p.description,
          image: p.images.map((i) => seo.absolute(i)),
          category: categoryName(p.categories[0] ?? ''),
          material: p.purity ? `${p.purity} gold` : 'Gold',
          weight: p.weightGrams ? { '@type': 'QuantitativeValue', value: p.weightGrams, unitCode: 'GRM' } : undefined,
          brand: { '@type': 'Brand', name: 'Kannan Jewellery' },
        },
      });
    });
  }
}

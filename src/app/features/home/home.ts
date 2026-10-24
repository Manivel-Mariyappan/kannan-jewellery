import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryBySlug } from '../../core/config/categories';
import { Category } from '../../core/models';
import { ContentStore } from '../../core/services/content-store';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { assetUrl } from '../../core/utils/download';
import { JewelleryViewer } from '../../shared/jewellery-viewer/jewellery-viewer';
import { ProductTile } from '../../shared/product-tile';
import { RevealDirective } from '../../shared/reveal.directive';
import { Showroom } from '../../shared/showroom/showroom';
import { WhatsappButton } from '../../shared/whatsapp-button';
import { GoldRatePanel } from '../gold-rate/gold-rate-panel';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, JewelleryViewer, ProductTile, RevealDirective, Showroom, WhatsappButton, GoldRatePanel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly store = inject(ContentStore);
  readonly products = inject(ProductService);

  readonly settings = this.store.settings;
  readonly assetUrl = assetUrl;
  readonly messages = enquiryMessages;

  /** Hero piece: the newest featured bridal item with a 3D model, if any. */
  readonly heroPiece = computed(
    () => this.products.bridal().find((p) => p.model3d && p.isFeatured) ?? this.products.with3d()[0] ?? null,
  );

  readonly editorial: { category: Category; area: string }[] = (
    [
      ['necklaces', 'a'],
      ['bangles', 'b'],
      ['earrings', 'c'],
      ['rings', 'd'],
      ['antique', 'e'],
      ['chains', 'f'],
    ] as const
  ).map(([slug, area]) => ({ category: categoryBySlug(slug)!, area }));

  readonly showroomPieces = computed(() => {
    const featured = this.products.featured().filter((p) => p.model3d);
    return featured.length >= 3 ? featured : this.products.with3d().slice(0, 8);
  });

  readonly bridalPreview = computed(() => this.products.bridal().slice(0, 3));
  readonly newArrivals = computed(() => this.products.newArrivals().slice(0, 8));

  readonly fullAddress = computed(() => {
    const s = this.settings();
    return s ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ') : '';
  });

  readonly pillars = [
    { title: 'Purity, clearly stated', text: 'Every piece is listed with its purity and weight, so you know exactly what you are choosing.' },
    { title: 'Transparent pricing', text: "We walk you through today's gold rate, making charges and taxes before you decide. No surprises at the counter." },
    { title: 'Crafted to last', text: 'Traditional techniques and careful finishing, so your jewellery can be worn for generations.' },
    { title: 'Personal service', text: 'Ask about any piece on WhatsApp, request more photos, or book a private bridal consultation.' },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'Kannan Jewellery — Timeless Gold. Eternal Elegance.',
      description:
        "Explore 22K and 18K gold necklaces, bangles, earrings, rings and bridal jewellery at Kannan Jewellery. See pieces in 3D, check today's gold rate and enquire on WhatsApp.",
      path: '/',
    });
  }
}

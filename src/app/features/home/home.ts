import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config/categories';
import { ContentStore } from '../../core/services/content-store';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { assetUrl } from '../../core/utils/url';
import { Icon } from '../../shared/icons';
import { JewelleryViewer } from '../../shared/jewellery-viewer/jewellery-viewer';
import { ProductTile } from '../../shared/product-tile';
import { RevealDirective } from '../../shared/reveal.directive';
import { Showroom } from '../../shared/showroom/showroom';
import { WhatsappButton } from '../../shared/whatsapp-button';
import { GoldRatePanel } from '../gold-rate/gold-rate-panel';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Icon,
    JewelleryViewer,
    ProductTile,
    RevealDirective,
    Showroom,
    WhatsappButton,
    GoldRatePanel,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly store = inject(ContentStore);
  private readonly products = inject(ProductService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly settings = this.store.settings;
  readonly assetUrl = assetUrl;
  readonly messages = enquiryMessages;
  readonly categories = CATEGORIES.filter((c) => c.slug !== 'traditional');

  // Prefer a featured bridal piece that has a 3D model.
  readonly heroPiece = computed(
    () =>
      this.products.bridal().find((p) => p.model3d && p.isFeatured) ??
      this.products.with3d()[0] ??
      null,
  );
  readonly newArrivals = computed(() => this.products.newArrivals().slice(0, 8));
  readonly featured = computed(() => this.products.featured().slice(0, 8));
  readonly showroomPieces = computed(() => {
    const featured = this.products.featured().filter((p) => p.model3d);
    return featured.length >= 3 ? featured : this.products.with3d().slice(0, 8);
  });

  readonly fullAddress = computed(() => {
    const s = this.settings();
    return s
      ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ')
      : '';
  });
  private readonly mapsQuery = computed(() =>
    encodeURIComponent(this.settings()?.mapsQuery || this.fullAddress()),
  );
  // Safe to trust: the query is URI-encoded, so it can't change the host or path.
  readonly mapUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${this.mapsQuery()}&output=embed`,
    ),
  );
  readonly directionsUrl = computed(
    () => `https://www.google.com/maps/dir/?api=1&destination=${this.mapsQuery()}`,
  );

  readonly pillars = [
    {
      icon: '◆',
      title: 'Purity clearly stated',
      text: 'Every piece is listed with its purity (22K, 18K) and weight in grams.',
    },
    {
      icon: '₹',
      title: 'Transparent pricing',
      text: "Today's gold rate, making charges and GST explained before you buy.",
    },
    {
      icon: '✦',
      title: 'Fine craftsmanship',
      text: 'Careful finishing and comfortable designs, made to last for generations.',
    },
    {
      icon: '✆',
      title: 'Personal service',
      text: 'Ask about any piece on WhatsApp, request photos or book a bridal visit.',
    },
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

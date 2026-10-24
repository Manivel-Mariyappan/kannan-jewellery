import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { assetUrl } from '../../core/utils/download';
import { ProductTile } from '../../shared/product-tile';
import { RevealDirective } from '../../shared/reveal.directive';
import { Showroom } from '../../shared/showroom/showroom';
import { WhatsappButton } from '../../shared/whatsapp-button';

@Component({
  selector: 'app-bridal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductTile, RevealDirective, Showroom, WhatsappButton],
  templateUrl: './bridal.html',
  styleUrl: './bridal.scss',
})
export class Bridal {
  private readonly products = inject(ProductService);

  readonly assetUrl = assetUrl;
  readonly consultMessage = enquiryMessages.bridal();

  /** Traditional = bridal pieces also tagged traditional or antique; the rest are contemporary. */
  readonly traditional = computed(() =>
    this.products.bridal().filter((p) => p.categories.some((c) => c === 'traditional' || c === 'antique')),
  );
  readonly contemporary = computed(() => this.products.bridal().filter((p) => !this.traditional().includes(p)));
  readonly with3d = computed(() => this.products.bridal().filter((p) => p.model3d));
  readonly highlight = computed(() => this.products.bridal().find((p) => p.isFeatured) ?? this.products.bridal()[0]);

  readonly steps = [
    { title: 'Message us', text: 'Share your wedding date, the pieces you have in mind and a budget range on WhatsApp.' },
    { title: 'Visit the showroom', text: 'Set aside an unhurried slot to see and try on necklaces, harams, bangles and jhumkas.' },
    { title: 'Complete your set', text: 'We help you balance traditional and contemporary pieces and confirm weights and prices.' },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'Bridal Gold Jewellery',
      description:
        'Traditional and contemporary bridal gold jewellery at Kannan Jewellery: harams, layered necklaces, kadas and jhumkas. Book a bridal consultation on WhatsApp.',
      path: '/bridal',
      image: 'demo/shots/maharani-bridal-haram-1.webp',
    });
  }
}

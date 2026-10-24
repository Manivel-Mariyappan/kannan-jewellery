import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../core/services/content-store';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { assetUrl } from '../../core/utils/url';
import { RevealDirective } from '../../shared/reveal.directive';
import { WhatsappButton } from '../../shared/whatsapp-button';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, WhatsappButton],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  private readonly store = inject(ContentStore);
  readonly settings = this.store.settings;
  readonly assetUrl = assetUrl;

  readonly fullAddress = computed(() => {
    const s = this.settings();
    return s
      ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ')
      : '';
  });
  readonly message = computed(() =>
    enquiryMessages.general(this.settings()?.shopName ?? 'Kannan Jewellery'),
  );

  readonly values = [
    {
      title: 'Honesty',
      text: 'Purity, weight and charges are explained clearly, so you can compare and decide with confidence.',
    },
    {
      title: 'Craft',
      text: 'Designs chosen for their finish, comfort and durability, not only their look on the display.',
    },
    {
      title: 'Tradition',
      text: 'Respect for the temple, antique and bridal styles that families have treasured for generations.',
    },
    {
      title: 'Care',
      text: 'Personal attention before and after you buy, from consultation to cleaning and adjustments.',
    },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'About Us',
      description:
        "Kannan Jewellery's story, values and craftsmanship, and how gold jewellery prices are worked out: gold value, making charges and GST.",
      path: '/about',
    });
  }
}

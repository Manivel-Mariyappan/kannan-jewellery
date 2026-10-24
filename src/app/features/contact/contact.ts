import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ContentStore } from '../../core/services/content-store';
import { SeoService } from '../../core/services/seo.service';
import { WhatsappService, enquiryMessages } from '../../core/services/whatsapp.service';
import { Icon } from '../../shared/icons';
import { RevealDirective } from '../../shared/reveal.directive';
import { WhatsappButton } from '../../shared/whatsapp-button';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RevealDirective, WhatsappButton],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly store = inject(ContentStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly whatsapp = inject(WhatsappService);

  readonly settings = this.store.settings;
  readonly whatsappConfigured = this.whatsapp.configured;
  // 918098413773 -> +91 80984 13773
  readonly whatsappDisplay = computed(() => {
    const n = this.whatsapp.number();
    return n.length === 12 && n.startsWith('91') ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : `+${n}`;
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
  readonly message = computed(() =>
    enquiryMessages.general(this.settings()?.shopName ?? 'Kannan Jewellery'),
  );

  constructor() {
    inject(SeoService).set({
      title: 'Contact & Directions',
      description:
        'Address, phone, WhatsApp, opening hours and directions to the Kannan Jewellery showroom on Salem Main Road.',
      path: '/contact',
    });
  }
}

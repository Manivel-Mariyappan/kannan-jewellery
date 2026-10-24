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
  template: `
    <header class="head">
      <div class="container">
        <p class="eyebrow" appReveal>Contact Us</p>
        <h1 class="display" appReveal [revealDelay]="80">Visit the <em class="serif-accent">showroom</em></h1>
        <p class="lead" appReveal [revealDelay]="140">Come in to see our collections, or message us on WhatsApp for prices, photos and appointments.</p>
      </div>
    </header>

    @if (settings(); as s) {
      <section class="container grid">
        <div class="details">
          <div class="item" appReveal>
            <app-icon name="pin" />
            <div>
              <h2>Address</h2>
              <p>{{ fullAddress() }}</p>
              <a class="link-arrow" [href]="directionsUrl()" target="_blank" rel="noopener">Get directions</a>
            </div>
          </div>

          @if (s.phone) {
            <div class="item" appReveal>
              <app-icon name="phone" />
              <div>
                <h2>Phone</h2>
                <p><a [href]="'tel:' + s.phone">{{ s.phone }}</a></p>
              </div>
            </div>
          }

          <div class="item" appReveal>
            <app-icon name="whatsapp" />
            <div>
              <h2>WhatsApp</h2>
              @if (whatsappConfigured()) {
                <p>{{ whatsappDisplay() }}</p>
                <app-whatsapp-button [message]="message()" label="Chat on WhatsApp" [small]="true" />
              } @else {
                <p>WhatsApp enquiries are coming soon. Please call or visit us.</p>
              }
            </div>
          </div>

          @if (s.email) {
            <div class="item" appReveal>
              <app-icon name="mail" />
              <div>
                <h2>Email</h2>
                <p><a [href]="'mailto:' + s.email">{{ s.email }}</a></p>
              </div>
            </div>
          }

          <div class="item" appReveal>
            <app-icon name="clock" />
            <div>
              <h2>Opening hours</h2>
              <dl class="hours">
                @for (h of s.openingHours; track h.days) {
                  <div><dt>{{ h.days }}</dt><dd>{{ h.hours }}</dd></div>
                }
              </dl>
            </div>
          </div>

          @if (s.directions) {
            <div class="item" appReveal>
              <app-icon name="pin" />
              <div>
                <h2>Finding us</h2>
                <p class="pre">{{ s.directions }}</p>
              </div>
            </div>
          }
        </div>

        <div class="map" appReveal="fade-left">
          <iframe
            [src]="mapUrl()"
            [title]="'Map showing ' + s.shopName"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </section>
    }
  `,
  styles: `
    .head {
      padding-block: 1.5rem 0.5rem;
    }
    .head .container {
      padding-inline: clamp(1.25rem, 4vw, 2.5rem);
      padding-block: clamp(1.5rem, 4vw, 2.5rem);
      background: linear-gradient(120deg, #fff8ea, #f7f5f0);
      border-radius: calc(var(--radius) + 6px);
    }
    .head .display {
      font-size: clamp(1.8rem, 3.6vw, 2.6rem);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: clamp(2rem, 5vw, 5rem);
      padding-block: 1.5rem 3rem;
    }
    .item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1.25rem;
      padding: 1.1rem 0;
      border-bottom: 1px solid var(--line);
    }
    .item:first-child {
      padding-top: 0;
    }
    .item > app-icon {
      width: 2.4rem;
      height: 2.4rem;
      display: grid !important;
      place-items: center;
      border-radius: 50%;
      background: var(--accent-soft);
      color: var(--accent-ink);
    }
    .item h2 {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 0.25rem;
    }
    .item p {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.6rem;
    }
    .item p a {
      text-decoration: none;
    }
    .pre {
      white-space: pre-line;
      font-family: var(--font-body);
      font-size: 1rem;
    }
    .hours {
      margin: 0;
    }
    .hours div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.35rem 0;
    }
    .hours dd {
      margin: 0;
      color: var(--brown);
    }
    .map {
      position: relative;
      min-height: 420px;
      background: var(--surface);
      border-radius: var(--radius);
      overflow: hidden;
    }
    iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Contact {
  private readonly store = inject(ContentStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly whatsapp = inject(WhatsappService);

  readonly settings = this.store.settings;
  readonly whatsappConfigured = this.whatsapp.configured;
  /** 918098413773 → +91 80984 13773 */
  readonly whatsappDisplay = computed(() => {
    const n = this.whatsapp.number();
    return n.length === 12 && n.startsWith('91') ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : `+${n}`;
  });

  readonly fullAddress = computed(() => {
    const s = this.settings();
    return s ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ') : '';
  });
  private readonly mapsQuery = computed(() => encodeURIComponent(this.settings()?.mapsQuery || this.fullAddress()));
  /** Keyless Google Maps embed; the query is URI-encoded so it cannot change the URL's origin or path. */
  readonly mapUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${this.mapsQuery()}&output=embed`),
  );
  readonly directionsUrl = computed(() => `https://www.google.com/maps/dir/?api=1&destination=${this.mapsQuery()}`);
  readonly message = computed(() => enquiryMessages.general(this.settings()?.shopName ?? 'Kannan Jewellery'));

  constructor() {
    inject(SeoService).set({
      title: 'Contact & Directions',
      description: 'Address, phone, WhatsApp, opening hours and directions to the Kannan Jewellery showroom on Salem Main Road.',
      path: '/contact',
    });
  }
}

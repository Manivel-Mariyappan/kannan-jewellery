import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config/categories';
import { ContentStore } from '../../core/services/content-store';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Icon } from '../icons';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="container grid">
      <div class="brand-col">
        <p class="brand">Kannan</p>
        <p class="brand-sub">Jewellery</p>
        <p class="about">{{ settings()?.tagline }} Fine gold jewellery, made to be worn and treasured for generations.</p>
        @if (whatsappHref(); as href) {
          <a class="btn btn-light btn-sm" [href]="href" target="_blank" rel="noopener"><app-icon name="whatsapp" [size]="16" />Chat with us</a>
        }
      </div>

      <nav aria-label="Collections">
        <h2>Collections</h2>
        @for (c of categories; track c.slug) {
          <a [routerLink]="['/collections', c.slug]">{{ c.name }}</a>
        }
      </nav>

      <nav aria-label="Explore">
        <h2>Explore</h2>
        <a routerLink="/bridal">Bridal Collection</a>
        <a routerLink="/about">Our Story</a>
        <a routerLink="/contact">Visit the Showroom</a>
      </nav>

      @if (settings(); as s) {
        <address>
          <h2>Showroom</h2>
          <p><app-icon name="pin" [size]="16" />{{ fullAddress() }}</p>
          @if (s.phone) {
            <p><app-icon name="phone" [size]="16" /><a [href]="'tel:' + s.phone">{{ s.phone }}</a></p>
          }
          @if (s.email) {
            <p><app-icon name="mail" [size]="16" /><a [href]="'mailto:' + s.email">{{ s.email }}</a></p>
          }
          @for (h of s.openingHours; track h.days) {
            <p><app-icon name="clock" [size]="16" />{{ h.days }}: {{ h.hours }}</p>
          }
        </address>
      }
    </div>

    <div class="container legal">
      <p>© {{ year }} {{ settings()?.shopName ?? 'Kannan Jewellery' }}. All rights reserved.</p>
      <p>Gold rates shown are indicative. Final prices include making charges, applicable taxes and other charges.</p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--brown-deep);
      color: #cbbba3;
      padding-top: clamp(4rem, 8vw, 6rem);
      font-size: 0.9rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1.3fr;
      gap: 3rem;
    }
    .brand {
      margin: 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      background: var(--gold-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1;
    }
    .brand-sub {
      margin: 0.3rem 0 1.5rem;
      font-size: 0.6rem;
      letter-spacing: 0.6em;
      text-transform: uppercase;
      color: var(--champagne);
    }
    .about {
      max-width: 22rem;
      margin-bottom: 1.75rem;
    }
    h2 {
      font-family: var(--font-body);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--champagne);
      margin-bottom: 1.25rem;
    }
    nav {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    a {
      text-decoration: none;
      transition: color 0.2s;
    }
    a:hover {
      color: var(--champagne);
    }
    address {
      font-style: normal;
    }
    address p {
      display: flex;
      gap: 0.7rem;
      align-items: flex-start;
      margin-bottom: 0.7rem;
    }
    address app-icon {
      margin-top: 0.3rem;
      color: var(--gold);
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.5rem 2rem;
      margin-top: 4rem;
      padding-block: 1.75rem 6rem;
      border-top: 1px solid rgba(232, 213, 169, 0.14);
      font-size: 0.78rem;
      color: #9c8c75;
    }
    .legal p {
      margin: 0;
    }
    @media (max-width: 960px) {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 560px) {
      .grid {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
    }
  `,
})
export class SiteFooter {
  private readonly store = inject(ContentStore);
  private readonly whatsapp = inject(WhatsappService);

  readonly categories = CATEGORIES;
  readonly year = new Date().getFullYear();
  readonly settings = this.store.settings;
  readonly whatsappHref = computed(() => this.whatsapp.generalLink());
  readonly fullAddress = computed(() => {
    const s = this.settings();
    return s ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ') : '';
  });
}

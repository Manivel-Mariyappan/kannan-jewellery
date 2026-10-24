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
        <p class="brand"><span class="mark" aria-hidden="true">K</span>{{ settings()?.shopName ?? 'Kannan Jewellery' }}</p>
        <p class="about">{{ settings()?.tagline }} Fine 22K and 18K gold jewellery for every day and every celebration.</p>
        @if (whatsappHref(); as href) {
          <a class="btn btn-whatsapp btn-sm" [href]="href" target="_blank" rel="noopener"><app-icon name="whatsapp" [size]="16" />Chat on WhatsApp</a>
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
        <a routerLink="/" fragment="gold-rate">Today's Gold Rate</a>
        <a routerLink="/bridal">Bridal Collection</a>
        <a routerLink="/about">About Us</a>
        <a routerLink="/contact">Contact & Directions</a>
      </nav>

      @if (settings(); as s) {
        <address>
          <h2>Visit the showroom</h2>
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
      <p>Gold rates are indicative. Final prices include making charges, GST and other applicable charges.</p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 2rem;
      background: var(--surface);
      border-top: 1px solid var(--line);
      padding-top: 3rem;
      font-size: 0.88rem;
      color: var(--text-2);
    }
    .grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1.3fr;
      gap: 2rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0 0 0.75rem;
      font-family: var(--font-head);
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text);
    }
    .mark {
      width: 2rem;
      height: 2rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--gold-gradient);
      color: #fff;
      font-size: 0.95rem;
    }
    .about {
      max-width: 22rem;
    }
    h2 {
      font-family: var(--font-head);
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.85rem;
    }
    nav {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    a {
      text-decoration: none;
    }
    nav a:hover,
    address a:hover {
      color: var(--accent-ink);
    }
    address {
      font-style: normal;
    }
    address p {
      display: flex;
      gap: 0.55rem;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    address app-icon {
      margin-top: 0.2rem;
      color: var(--accent);
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.5rem 2rem;
      margin-top: 2.5rem;
      padding-block: 1.25rem 5.5rem;
      border-top: 1px solid var(--line);
      font-size: 0.78rem;
      color: var(--muted);
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

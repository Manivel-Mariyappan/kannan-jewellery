import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../core/services/content-store';
import { SeoService } from '../../core/services/seo.service';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { assetUrl } from '../../core/utils/download';
import { RevealDirective } from '../../shared/reveal.directive';
import { WhatsappButton } from '../../shared/whatsapp-button';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, WhatsappButton],
  template: `
    <header class="head">
      <div class="container intro">
        <div>
          <p class="eyebrow" appReveal>Our Story</p>
          <h1 class="display" appReveal [revealDelay]="80">Gold, chosen with <em class="serif-accent">care</em></h1>
        </div>
        <p class="lead" appReveal [revealDelay]="160">
          {{ settings()?.shopName ?? 'Kannan Jewellery' }} is a family jewellery showroom on Salem Main Road. We believe gold should be bought
          with confidence: clear purity, honest pricing, and designs that last beyond a single season.
        </p>
      </div>
    </header>

    <section class="container story">
      <div class="story-media" appReveal="fade-right">
        <img [src]="assetUrl('demo/shots/temple-pendant-necklace-1.webp')" alt="Antique temple gold necklace" loading="lazy" width="1000" height="1000" />
      </div>
      <div class="story-copy" appReveal="fade-left">
        <h2>Craftsmanship you can feel</h2>
        <p>
          A good piece of jewellery shows its quality in the details: the evenness of a bead strand, the finish inside a bangle, the way
          a jhumka hangs and moves. We choose designs for these details, from light daily-wear chains to heavy temple work for weddings.
        </p>
        <p>
          Every family has its own traditions. We are happy to take the time to understand yours, whether you are buying a first gold
          ring or planning a complete bridal set.
        </p>
        <!-- Shop owner: add your founding year, family history and karigar story here. -->
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div appReveal>
            <p class="eyebrow">What we stand for</p>
            <h2>Our values</h2>
          </div>
        </div>
        <ol class="values">
          @for (v of values; track v.title; let i = $index) {
            <li appReveal="fade-up" [revealDelay]="i * 90">
              <span class="num gold-text">0{{ i + 1 }}</span>
              <h3>{{ v.title }}</h3>
              <p>{{ v.text }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section bg-dark">
      <div class="container trust">
        <div appReveal>
          <p class="eyebrow">Purity & Transparency</p>
          <h2>How your price is worked out</h2>
          @if (settings()?.certification; as cert) {
            <p class="cert">{{ cert }}</p>
          } @else {
            <p class="lead">Ask us about the purity marking and certification of any piece before you buy. We are happy to explain it.</p>
          }
        </div>
        <ol class="formula" appReveal [revealDelay]="120">
          <li><strong>Gold value</strong><span>Today's per-gram rate for the purity × net weight of the piece</span></li>
          <li><strong>Making charges</strong><span>For the craftsmanship. Depends on the design and how intricate it is</span></li>
          <li><strong>Wastage / other charges</strong><span>Where applicable, explained before billing</span></li>
          <li><strong>GST</strong><span>As applicable under current tax rules</span></li>
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="container visit">
        <div appReveal>
          <p class="eyebrow">Visit us</p>
          <h2>{{ fullAddress() }}</h2>
        </div>
        <div class="cta" appReveal [revealDelay]="100">
          <a class="btn btn-outline" routerLink="/contact">Contact & directions</a>
          <app-whatsapp-button [message]="message()" />
        </div>
      </div>
    </section>
  `,
  styles: `
    .head {
      padding-block: 1.5rem 0;
    }
    .head .container {
      padding-block: clamp(1.5rem, 4vw, 2.5rem);
      background: linear-gradient(120deg, #fff8ea, #f7f5f0);
      border-radius: calc(var(--radius) + 6px);
    }
    .head .display {
      font-size: clamp(1.8rem, 3.6vw, 2.6rem);
    }
    .intro {
      display: grid;
      padding-inline: clamp(1.25rem, 4vw, 2.5rem) !important;
      grid-template-columns: 1.2fr 1fr;
      gap: 3rem;
      align-items: end;
    }
    .intro .lead {
      margin: 0;
    }
    .story {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: clamp(1.5rem, 4vw, 3rem);
      align-items: center;
      padding-block: clamp(2rem, 4vw, 3rem);
    }
    .story-media {
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: var(--radius);
      background: var(--surface);
    }
    .story-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .story-copy p {
      color: var(--text-2);
    }
    .values {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .values li {
      padding: 1.25rem;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
    }
    .values .num {
      display: grid;
      place-items: center;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      background: var(--accent-soft);
      color: var(--accent-ink);
      font-weight: 700;
      font-size: 0.85rem;
    }
    .values h3 {
      margin: 0.75rem 0 0.3rem;
    }
    .values p {
      color: var(--muted);
      margin: 0;
    }
    .trust {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: clamp(2rem, 6vw, 6rem);
    }
    .cert {
      padding-left: 1rem;
      border-left: 2px solid var(--gold);
    }
    .formula {
      list-style: none;
      margin: 0;
      padding: 0;
      counter-reset: f;
    }
    .formula li {
      display: grid;
      grid-template-columns: 12rem 1fr;
      gap: 1rem;
      padding: 1.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .formula li + li strong::before {
      content: '+ ';
      color: var(--gold-bright);
    }
    .formula strong {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }
    .formula span {
      color: #a8a29e;
    }
    .visit {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 2rem;
    }
    .visit h2 {
      max-width: 20ch;
      margin: 0;
    }
    .cta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    @media (max-width: 900px) {
      .intro,
      .story,
      .trust {
        grid-template-columns: 1fr;
      }
      .values {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 560px) {
      .values {
        grid-template-columns: 1fr;
      }
      .formula li {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
  `,
})
export class About {
  private readonly store = inject(ContentStore);
  readonly settings = this.store.settings;
  readonly assetUrl = assetUrl;

  readonly fullAddress = computed(() => {
    const s = this.settings();
    return s ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ') : '';
  });
  readonly message = computed(() => enquiryMessages.general(this.settings()?.shopName ?? 'Kannan Jewellery'));

  readonly values = [
    { title: 'Honesty', text: 'Purity, weight and charges are explained clearly, so you can compare and decide with confidence.' },
    { title: 'Craft', text: 'Designs chosen for their finish, comfort and durability, not only their look on the display.' },
    { title: 'Tradition', text: 'Respect for the temple, antique and bridal styles that families have treasured for generations.' },
    { title: 'Care', text: 'Personal attention before and after you buy, from consultation to cleaning and adjustments.' },
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

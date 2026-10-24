import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../core/config/categories';
import { Product } from '../core/models';
import { enquiryMessages } from '../core/services/whatsapp.service';
import { assetUrl } from '../core/utils/download';
import { Icon } from './icons';
import { WhatsappButton } from './whatsapp-button';

/** Product card: square image (second photo on hover), key specs and a WhatsApp enquiry. */
@Component({
  selector: 'app-product-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, WhatsappButton],
  template: `
    <a class="media" [routerLink]="['/jewellery', product().slug]" [attr.aria-label]="product().name + ', view details'">
      <img [src]="image()" [alt]="product().name" loading="lazy" decoding="async" width="1000" height="1000" />
      @if (hoverImage(); as hover) {
        <img class="alt" [src]="hover" alt="" loading="lazy" decoding="async" width="1000" height="1000" />
      }
      <span class="flags">
        @if (product().isNew) { <span class="tag tag-gold">New</span> }
        @if (product().model3d) { <span class="tag"><app-icon name="cube" [size]="11" />3D</span> }
      </span>
      @if (product().demo) { <span class="demo">Demo</span> }
    </a>
    <div class="body">
      <p class="cat">{{ category() }}</p>
      <h3><a [routerLink]="['/jewellery', product().slug]">{{ product().name }}</a></h3>
      <p class="specs">
        <span class="code">{{ product().code }}</span>
        @if (product().purity) { <span class="pill">{{ product().purity }}</span> }
        @if (product().weightGrams) { <span class="pill">{{ product().weightGrams }} g</span> }
      </p>
      <div class="cta"><app-whatsapp-button [message]="message()" label="Enquire" [ariaLabel]="'Enquire about ' + product().name + ' on WhatsApp'" variant="outline" [small]="true" /></div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      overflow: hidden;
      transition: box-shadow 0.25s, transform 0.25s, border-color 0.25s;
    }
    :host:hover {
      box-shadow: var(--shadow-hover);
      border-color: transparent;
      transform: translateY(-2px);
    }
    .media {
      position: relative;
      display: block;
      aspect-ratio: 1;
      background: var(--surface);
      overflow: hidden;
    }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.45s, transform 0.8s var(--ease);
    }
    .alt {
      opacity: 0;
    }
    .media:hover img {
      transform: scale(1.04);
    }
    .media:hover .alt {
      opacity: 1;
    }
    .flags {
      position: absolute;
      top: 0.6rem;
      left: 0.6rem;
      display: flex;
      gap: 0.3rem;
    }
    .demo {
      position: absolute;
      right: 0.6rem;
      bottom: 0.5rem;
      font-size: 0.65rem;
      color: var(--muted);
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      padding: 0.85rem 0.9rem 0.95rem;
      flex: 1;
    }
    .cat {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--accent-ink);
    }
    h3 {
      margin: 0;
      font-size: 0.98rem;
      line-height: 1.3;
    }
    h3 a {
      text-decoration: none;
    }
    h3 a:hover {
      color: var(--accent-ink);
    }
    .specs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      margin: 0.15rem 0 0.6rem;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .code {
      margin-right: 0.15rem;
    }
    .pill {
      padding: 0.05rem 0.45rem;
      background: var(--surface);
      border-radius: 999px;
      color: var(--text-2);
      font-weight: 500;
    }
    .cta {
      margin-top: auto;
    }
    app-whatsapp-button ::ng-deep .btn {
      width: 100%;
      color: var(--whatsapp);
    }
    app-whatsapp-button ::ng-deep .btn:hover {
      background: var(--whatsapp);
      border-color: var(--whatsapp);
      color: #fff;
    }
  `,
})
export class ProductTile {
  readonly product = input.required<Product>();

  readonly image = computed(() => assetUrl(this.product().images[0] ?? 'favicon.svg'));
  readonly hoverImage = computed(() => {
    const second = this.product().images[1];
    return second ? assetUrl(second) : null;
  });
  readonly category = computed(() => categoryName(this.product().categories[0] ?? ''));
  readonly message = computed(() => enquiryMessages.product(this.product()));
}

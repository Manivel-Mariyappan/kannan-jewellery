import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../core/config/categories';
import { Product } from '../core/models';
import { enquiryMessages } from '../core/services/whatsapp.service';
import { assetUrl } from '../core/utils/download';
import { Icon } from './icons';
import { WhatsappButton } from './whatsapp-button';

/**
 * Editorial product presentation: image-led, no card chrome. The whole image links to the
 * detail page; a WhatsApp enquiry sits beside the caption.
 */
@Component({
  selector: 'app-product-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, WhatsappButton],
  template: `
    <a class="frame" [routerLink]="['/jewellery', product().slug]" [attr.aria-label]="product().name + ', view details'">
      <img [src]="image()" [alt]="product().name" loading="lazy" decoding="async" width="1200" height="1500" />
      @if (hoverImage(); as hover) {
        <img class="alt" [src]="hover" alt="" loading="lazy" decoding="async" width="1200" height="1500" />
      }
      <span class="flags">
        @if (product().isNew) { <span class="tag tag-gold">New</span> }
        @if (product().model3d) { <span class="tag"><app-icon name="cube" [size]="11" /> 3D</span> }
        @if (product().demo) { <span class="tag">Demo</span> }
      </span>
    </a>
    <div class="caption">
      <div>
        <p class="meta">{{ category() }} · {{ product().code }}</p>
        <h3><a [routerLink]="['/jewellery', product().slug]">{{ product().name }}</a></h3>
        <p class="specs">
          @if (product().purity) { <span>{{ product().purity }}</span> }
          @if (product().weightGrams) { <span>{{ product().weightGrams }} g</span> }
        </p>
      </div>
      <app-whatsapp-button [message]="message()" label="" [ariaLabel]="'Enquire about ' + product().name + ' on WhatsApp'" variant="outline" [small]="true" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .frame {
      position: relative;
      display: block;
      overflow: hidden;
      background: var(--cream);
      aspect-ratio: var(--ratio, 4 / 5);
    }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 1.4s var(--ease), opacity 0.8s var(--ease);
    }
    .alt {
      opacity: 0;
    }
    .frame:hover img {
      transform: scale(1.045);
    }
    .frame:hover .alt {
      opacity: 1;
    }
    .flags {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      gap: 0.4rem;
    }
    .flags .tag {
      display: inline-flex;
      gap: 0.3rem;
      align-items: center;
    }
    .caption {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .meta {
      margin: 0 0 0.35rem;
      font-size: 0.66rem;
    }
    h3 {
      font-size: clamp(1.3rem, 2vw, 1.6rem);
      margin: 0 0 0.3rem;
    }
    h3 a {
      text-decoration: none;
    }
    h3 a:hover {
      color: var(--gold-deep);
    }
    .specs {
      display: flex;
      gap: 0.9rem;
      margin: 0;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .specs span + span::before {
      content: '·';
      margin-right: 0.9rem;
      color: var(--gold);
    }
    app-whatsapp-button ::ng-deep .btn {
      padding-inline: 0.8rem;
      flex: none;
    }
  `,
})
export class ProductTile {
  readonly product = input.required<Product>();

  readonly image = computed(() => assetUrl(this.product().images[0] ?? 'demo/necklace-1.svg'));
  readonly hoverImage = computed(() => {
    const second = this.product().images[1];
    return second ? assetUrl(second) : null;
  });
  readonly category = computed(() => categoryName(this.product().categories[0] ?? ''));
  readonly message = computed(() => enquiryMessages.product(this.product()));
}

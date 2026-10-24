import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../core/config/categories';
import { Product } from '../core/models';
import { enquiryMessages } from '../core/services/whatsapp.service';
import { assetUrl } from '../core/utils/url';
import { Icon } from './icons';
import { WhatsappButton } from './whatsapp-button';

@Component({
  selector: 'app-product-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, WhatsappButton],
  templateUrl: './product-tile.html',
  styleUrl: './product-tile.scss',
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

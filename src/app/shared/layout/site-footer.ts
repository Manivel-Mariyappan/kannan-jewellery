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
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
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
    return s
      ? [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode].filter(Boolean).join(', ')
      : '';
  });
}

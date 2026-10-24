import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { GoldRateService } from '../../core/services/gold-rate.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { formatInr } from '../../core/utils/gold-math';

/** Today's gold rate: 22K and 24K, per gram and per 8 grams (one sovereign). */
@Component({
  selector: 'app-gold-rate-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './gold-rate-panel.html',
  styleUrl: './gold-rate-panel.scss',
  host: { '[class.compact]': 'compact()' },
})
export class GoldRatePanel {
  private readonly rates = inject(GoldRateService);
  private readonly whatsapp = inject(WhatsappService);

  /** Compact variant for the product page sidebar. */
  readonly compact = input(false);

  readonly view = this.rates.view;
  readonly format = formatInr;
  readonly rateEnquiry = computed(() => this.whatsapp.link("Hello, could you please share today's gold rate?"));

  readonly statusLabel = computed(() => {
    switch (this.view().status) {
      case 'current':
        return this.view().source === 'api' ? 'Live rate' : 'Current rate';
      case 'delayed':
        return 'Delayed: please confirm';
      default:
        return 'Rate unavailable';
    }
  });
}

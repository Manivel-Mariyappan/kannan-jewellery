import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../core/services/content-store';
import { GoldRateService } from '../../core/services/gold-rate.service';
import { formatInr } from '../../core/utils/gold-math';
import { Icon } from '../../shared/icons';

@Component({
  selector: 'app-gold-rate-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, Icon],
  templateUrl: './gold-rate-ticker.html',
  styleUrl: './gold-rate-ticker.scss',
})
export class GoldRateTicker {
  readonly view = inject(GoldRateService).view;
  private readonly store = inject(ContentStore);
  readonly phone = computed(() => this.store.settings()?.phone ?? '');
  private readonly row = (purity: '22K' | '24K') =>
    computed(() => {
      const r = this.view().rows.find((x) => x.purity === purity && x.grams === 1);
      return r ? formatInr(r.price) : null;
    });
  readonly rate22 = this.row('22K');
  readonly rate24 = this.row('24K');
}

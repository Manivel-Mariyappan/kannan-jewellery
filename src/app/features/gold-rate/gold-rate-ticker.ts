import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../core/services/content-store';
import { GoldRateService } from '../../core/services/gold-rate.service';
import { formatInr } from '../../core/utils/gold-math';
import { Icon } from '../../shared/icons';

/** Top bar: today's per-gram rates (links to the full rate section) and quick contact. */
@Component({
  selector: 'app-gold-rate-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, Icon],
  template: `
    <div class="container bar">
      <a routerLink="/" fragment="gold-rate" class="rate" aria-label="Today's gold rate — see details">
        <span class="dot" [class]="view().status" aria-hidden="true"></span>
        <span class="label">Gold rate today</span>
        @if (rate22(); as r22) {
          <span>22K <strong>{{ r22 }}</strong>/g</span>
          <span class="sep" aria-hidden="true">|</span>
          <span>24K <strong>{{ rate24() }}</strong>/g</span>
          @if (view().status === 'delayed') {
            <span class="delayed">Delayed</span>
          } @else if (view().updatedAt) {
            <span class="time">· {{ view().updatedAt | date: 'd MMM, h:mm a' }}</span>
          }
        } @else {
          <span>Not published yet</span>
        }
      </a>
      @if (phone(); as p) {
        <a class="contact" [href]="'tel:' + p"><app-icon name="phone" [size]="14" />{{ p }}</a>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      font-size: 0.8rem;
      color: var(--text-2);
    }
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 2.25rem;
    }
    a {
      text-decoration: none;
    }
    .rate {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.2rem 0.6rem;
    }
    .rate:hover .label {
      color: var(--accent-ink);
    }
    .label {
      font-weight: 600;
      color: var(--text);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #a8a29e;
    }
    .dot.current {
      background: #16a34a;
    }
    .dot.delayed {
      background: #d97706;
    }
    strong {
      color: var(--accent-ink);
      font-weight: 700;
    }
    .sep {
      color: var(--line);
    }
    .time {
      color: var(--muted);
    }
    .delayed {
      color: #b45309;
      font-weight: 600;
    }
    .contact {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
    }
    .contact:hover {
      color: var(--accent-ink);
    }
    @media (max-width: 640px) {
      .label,
      .time,
      .contact {
        display: none;
      }
    }
  `,
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

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GoldRateService } from '../../core/services/gold-rate.service';
import { formatInr } from '../../core/utils/gold-math';

/** Slim strip above the header showing today's per-gram rates; links to the full rate section. */
@Component({
  selector: 'app-gold-rate-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  template: `
    <a routerLink="/" fragment="gold-rate" class="container strip" aria-label="Today's gold rate — see details">
      <span class="label"><span class="dot" [class]="view().status" aria-hidden="true"></span>Today's Gold Rate</span>
      @if (rate22(); as r22) {
        <span class="rates">
          <span>22K <strong>{{ r22 }}</strong>/g</span>
          <span>24K <strong>{{ rate24() }}</strong>/g</span>
          @if (view().status === 'delayed') {
            <span class="delayed">Delayed</span>
          } @else if (view().updatedAt) {
            <span class="time">{{ view().updatedAt | date: 'd MMM, h:mm a' }}</span>
          }
        </span>
      } @else {
        <span class="rates">Not published yet. Ask us for today's rate.</span>
      }
      <span class="more" aria-hidden="true">View →</span>
    </a>
  `,
  styles: `
    :host {
      display: block;
      background: var(--brown-deep);
      color: #d8cab3;
      font-size: 0.78rem;
    }
    .strip {
      display: flex;
      align-items: center;
      gap: 0.5rem 1.5rem;
      min-height: 2.4rem;
      text-decoration: none;
    }
    .label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.66rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--champagne);
      white-space: nowrap;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #b8a78e;
    }
    .dot.current {
      background: #6fcf97;
    }
    .dot.delayed {
      background: #f2c94c;
    }
    .rates {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 1.25rem;
    }
    strong {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 600;
      background: var(--gold-gradient);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .time,
    .delayed {
      color: #9c8c75;
    }
    .delayed {
      color: #f2c94c;
    }
    .more {
      margin-left: auto;
      color: var(--champagne);
      white-space: nowrap;
    }
    .strip:hover .more {
      color: var(--gold-bright);
    }
    @media (max-width: 560px) {
      .label {
        letter-spacing: 0.12em;
      }
      .time,
      .more {
        display: none;
      }
    }
  `,
})
export class GoldRateTicker {
  readonly view = inject(GoldRateService).view;
  private readonly row = (purity: '22K' | '24K') =>
    computed(() => {
      const r = this.view().rows.find((x) => x.purity === purity && x.grams === 1);
      return r ? formatInr(r.price) : null;
    });
  readonly rate22 = this.row('22K');
  readonly rate24 = this.row('24K');
}

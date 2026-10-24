import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Reusable admin card (Bootstrap card with shadow). Content is projected into three slots:
 *
 * ```html
 * <admin-card heading="Details" subtitle="Name, code and purity" icon="◆">
 *   <button card-actions class="btn btn-sm btn-link">Reset</button>   <!-- header, right side -->
 *   …form fields…                                                    <!-- body -->
 *   <div card-footer>Help text or buttons</div>                      <!-- footer, optional -->
 * </admin-card>
 * ```
 * The footer is hidden automatically when nothing is projected into it.
 */
@Component({
  selector: 'admin-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card admin-card shadow-sm border-0' },
  template: `
    @if (heading()) {
      <div class="card-header d-flex align-items-center gap-2">
        @if (icon()) {
          <span class="card-icon" aria-hidden="true">{{ icon() }}</span>
        }
        <div class="flex-grow-1">
          <h2 class="h6 mb-0">
            {{ heading() }}
            @if (required()) { <span class="text-danger" aria-hidden="true">*</span> }
          </h2>
          @if (subtitle()) {
            <p class="small text-body-secondary mb-0">{{ subtitle() }}</p>
          }
        </div>
        <div class="card-actions"><ng-content select="[card-actions]" /></div>
      </div>
    }
    <div class="card-body">
      <ng-content />
    </div>
    <div class="card-footer"><ng-content select="[card-footer]" /></div>
  `,
  styles: `
    :host {
      background: #fff;
      --bs-card-bg: #fff;
      --bs-card-border-radius: 0.75rem;
      --bs-card-inner-border-radius: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .card-header {
      padding: 0.85rem 1.1rem;
      background: #fff;
      border-bottom: 1px solid #efebe4;
    }
    .card-icon {
      width: 2rem;
      height: 2rem;
      display: grid;
      place-items: center;
      flex: none;
      border-radius: 0.5rem;
      background: #fbf3e2;
      color: #8a5d14;
      font-size: 0.95rem;
    }
    .card-body {
      padding: 1.1rem;
      background: #fff;
    }
    .card-actions:empty,
    .card-footer:empty {
      display: none;
    }
    .card-footer {
      padding: 0.7rem 1.1rem;
      background: #fff;
      border-top: 1px solid #efebe4;
      color: #6b6560;
      font-size: 0.85rem;
    }
  `,
})
export class AdminCard {
  readonly heading = input('');
  readonly subtitle = input('');
  readonly icon = input('');
  /** Marks the section as required (red asterisk next to the heading). */
  readonly required = input(false);
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Icon } from '../icons';

/** Floating click-to-chat button shown on every public page. */
@Component({
  selector: 'app-whatsapp-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (href(); as url) {
      <a [href]="url" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
        <app-icon name="whatsapp" [size]="30" />
        <span class="label">Chat with us</span>
      </a>
    }
  `,
  styles: `
    :host {
      position: fixed;
      right: clamp(1rem, 3vw, 2rem);
      bottom: clamp(1rem, 3vw, 2rem);
      z-index: 40;
    }
    a {
      display: flex;
      align-items: center;
      gap: 0;
      height: 3.6rem;
      padding: 0 0.9rem;
      color: #fff;
      background: var(--whatsapp);
      border-radius: 999px;
      box-shadow: 0 14px 34px -10px rgba(16, 80, 44, 0.55);
      text-decoration: none;
      overflow: hidden;
      transition: gap 0.4s var(--ease), padding 0.4s var(--ease), transform 0.3s var(--ease);
    }
    .label {
      max-width: 0;
      overflow: hidden;
      white-space: nowrap;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      transition: max-width 0.4s var(--ease);
    }
    a:hover,
    a:focus-visible {
      gap: 0.6rem;
      padding-right: 1.4rem;
      transform: translateY(-2px);
    }
    a:hover .label,
    a:focus-visible .label {
      max-width: 10rem;
    }
  `,
})
export class WhatsappFab {
  private readonly whatsapp = inject(WhatsappService);
  readonly href = computed(() => this.whatsapp.generalLink());
}

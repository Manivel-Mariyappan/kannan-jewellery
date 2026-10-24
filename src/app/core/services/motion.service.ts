import { Injectable, signal } from '@angular/core';
import AOS from 'aos';

/** Tracks the visitor's reduced-motion preference and owns the AOS lifecycle. */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  readonly reduced = signal(this.query?.matches ?? false);
  private started = false;

  constructor() {
    this.query?.addEventListener('change', (e) => this.reduced.set(e.matches));
  }

  start(): void {
    if (this.started || this.reduced()) return;
    this.started = true;
    AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 60 });
  }

  /** Re-scan the page after route changes so newly rendered sections animate in. */
  refresh(): void {
    if (!this.started) return;
    AOS.refreshHard();
    // AOS only reveals elements from its scroll handler; nudge it so sections already
    // in view on a freshly loaded page are never left hidden.
    requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')));
  }
}

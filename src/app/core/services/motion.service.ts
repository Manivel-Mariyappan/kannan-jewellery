import { Injectable, signal } from '@angular/core';
import AOS from 'aos';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly query =
    typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
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

  refresh(): void {
    if (!this.started) return;
    AOS.refreshHard();
    // AOS only reveals elements on scroll, so fire one to show what's already in view.
    requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')));
  }
}

import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ContentStore } from './core/services/content-store';
import { MotionService } from './core/services/motion.service';
import { SeoService } from './core/services/seo.service';
import { GoldRateTicker } from './features/gold-rate/gold-rate-ticker';
import { SiteFooter } from './shared/layout/site-footer';
import { SiteHeader } from './shared/layout/site-header';
import { WhatsappFab } from './shared/layout/whatsapp-fab';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, SiteHeader, SiteFooter, WhatsappFab, GoldRateTicker],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly store = inject(ContentStore);
  private readonly motion = inject(MotionService);
  /** The admin portal is a separate area: no website header, footer or WhatsApp button. */
  readonly isAdmin = signal(location.pathname.startsWith('/admin'));

  constructor() {
    const router = inject(Router);
    const seo = inject(SeoService);
    const doc = inject(DOCUMENT);

    router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.isAdmin.set(e.urlAfterRedirects.startsWith('/admin'));
        // Leaving the admin portal: drop its Bootstrap stylesheet (added by src/admin/core/admin-styles.ts).
        if (!this.isAdmin()) {
          doc.documentElement.classList.remove('kj-admin');
          doc.getElementById('kj-admin-css')?.remove();
        }
        // Let the new page render, then let AOS pick up its sections.
        setTimeout(() => this.motion.refresh(), 60);
      });

    effect(() => {
      const settings = this.store.settings();
      if (settings) seo.setBusiness(settings);
    });

    afterNextRender(() => this.motion.start());
  }
}

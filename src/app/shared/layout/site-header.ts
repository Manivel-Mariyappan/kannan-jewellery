import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { IsActiveMatchOptions, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Icon } from '../icons';

/** Exact path match; the fragment decides between Home and Gold Rate. */
const exactWith = (fragment: 'exact' | 'ignored'): IsActiveMatchOptions => ({
  paths: 'exact',
  queryParams: 'ignored',
  matrixParams: 'ignored',
  fragment,
});

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  host: {
    '[class.scrolled]': 'scrolled()',
    '[class.menu-open]': 'menuOpen()',
    '(window:scroll)': 'onScroll()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class SiteHeader {
  private readonly whatsapp = inject(WhatsappService);

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly enquireHref = computed(() => this.whatsapp.generalLink());

  readonly links: { path: string; label: string; fragment?: string; match: IsActiveMatchOptions | { exact: boolean } }[] = [
    { path: '/', label: 'Home', match: exactWith('ignored') },
    { path: '/', label: 'Gold Rate', fragment: 'gold-rate', match: exactWith('exact') },
    { path: '/collections', label: 'Collections', match: { exact: false } },
    { path: '/bridal', label: 'Bridal', match: { exact: false } },
    { path: '/about', label: 'About', match: { exact: false } },
    { path: '/contact', label: 'Contact', match: { exact: false } },
  ];

  constructor() {
    // Close the mobile menu after navigating.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  toggle(): void {
    this.menuOpen.update((v) => !v);
  }
}

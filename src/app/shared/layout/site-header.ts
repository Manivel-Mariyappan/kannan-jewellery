import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CATEGORIES } from '../../core/config/categories';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Icon } from '../icons';

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
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly enquireHref = computed(() => this.whatsapp.generalLink());

  readonly categories = CATEGORIES.filter((c) => c.slug !== 'traditional');

  readonly links: { path: string; label: string; fragment?: string; exact?: boolean }[] = [
    // Same path as Home, so match exactly (including #gold-rate).
    { path: '/', label: 'Gold Rate', fragment: 'gold-rate', exact: true },
    { path: '/bridal', label: 'Bridal' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  constructor() {
    // Close the mobile menu after navigating.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  toggle(): void {
    this.menuOpen.update((v) => !v);
  }

  search(term: string): void {
    const q = term.trim();
    void this.router.navigate(['/collections'], { queryParams: q ? { q } : {} });
  }
}

import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ContentStore } from '../../core/services/content-store';

/**
 * Admin layout. Styles here are unencapsulated but scoped under `.admin` so the child screens
 * share one set of table / form / toolbar styles.
 */
@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  readonly store = inject(ContentStore);

  readonly nav = [
    { path: 'products', label: 'Products' },
    { path: 'gold-rate', label: 'Gold rate' },
    { path: 'settings', label: 'Shop settings' },
    { path: 'publish', label: 'Publish' },
  ];

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex' });
  }

  lock(): void {
    this.auth.lock();
    void this.router.navigateByUrl('/admin/login');
  }
}

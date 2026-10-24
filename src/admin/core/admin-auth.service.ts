import { Injectable, computed, inject, signal } from '@angular/core';
import { APP_CONFIG } from '../../app/core/config/app-config';
import { AdminDataService } from './admin-data.service';

const SESSION_KEY = 'kj.admin.session';
/** Older sessions only stored a flag; treat them as the default admin account. */
const LEGACY_KEY = 'kj.admin.unlocked';

async function sha256Hex(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Username + password login for the browser-only admin portal.
 *
 * The username must be an active account on the Admin users screen. Until the ASP.NET Core
 * Auth API is connected, every account signs in with the admin password configured in
 * app-config.ts (stored there as a SHA-256 hash).
 *
 * This is NOT server-side security: anyone can read the site's JavaScript. It keeps casual
 * visitors out of the editing screens, which cannot change the live site by themselves.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly data = inject(AdminDataService);

  readonly username = signal<string | null>(this.readSession());
  readonly unlocked = computed(() => this.username() !== null);
  readonly currentUser = computed(() => this.data.users.all().find((u) => u.username === this.username()) ?? null);

  /** Returns an error message, or null on success. */
  async login(username: string, password: string): Promise<string | null> {
    const name = username.trim().toLowerCase();
    const user = this.data.users.all().find((u) => u.username.toLowerCase() === name);
    const passwordOk = (await sha256Hex(password)) === APP_CONFIG.adminPasscodeSha256;
    if (!user || !passwordOk) return 'Incorrect username or password.';
    if (!user.active) return 'This account is disabled. Ask an admin to activate it.';
    this.data.users.upsert({ ...user, lastLogin: new Date().toISOString() });
    this.username.set(user.username);
    try {
      sessionStorage.setItem(SESSION_KEY, user.username);
    } catch {
      /* session-only login still works for this page view */
    }
    return null;
  }

  lock(): void {
    this.username.set(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }

  private readSession(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEY) ?? (sessionStorage.getItem(LEGACY_KEY) === '1' ? 'admin' : null);
    } catch {
      return null;
    }
  }
}

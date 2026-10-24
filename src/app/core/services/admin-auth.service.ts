import { Injectable, signal } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

const SESSION_KEY = 'kj.admin.unlocked';

async function sha256Hex(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Passcode lock for the browser-only admin portal.
 *
 * This is NOT server-side security: anyone can read the site's JavaScript. It keeps casual
 * visitors out of the editing screens, and that is enough here because the portal cannot change
 * the live site — publishing needs access to the hosting. Real multi-user authentication needs
 * a backend (see README → "Moving to a backend").
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  readonly unlocked = signal(this.readSession());

  async unlock(passcode: string): Promise<boolean> {
    const ok = (await sha256Hex(passcode)) === APP_CONFIG.adminPasscodeSha256;
    if (ok) {
      this.unlocked.set(true);
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* session-only unlock still works for this page view */
      }
    }
    return ok;
  }

  lock(): void {
    this.unlocked.set(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  private readSession(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  }
}

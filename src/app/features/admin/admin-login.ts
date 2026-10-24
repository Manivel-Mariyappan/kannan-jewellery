import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="wrap">
      <form (ngSubmit)="submit()" class="card">
        <p class="eyebrow">Kannan Jewellery</p>
        <h1>Admin portal</h1>
        <p class="hint">Enter the admin passcode to manage products, gold rates and shop details.</p>
        <label class="field">
          <span>Passcode</span>
          <input class="input" type="password" name="passcode" [(ngModel)]="passcode" autocomplete="current-password" required autofocus />
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="btn btn-gold" type="submit" [disabled]="busy()">Unlock</button>
        <a routerLink="/" class="link-arrow back">Back to website</a>
      </form>
    </section>
  `,
  styles: `
    .wrap {
      min-height: calc(100vh - var(--header-h));
      display: grid;
      place-items: center;
      padding: 2rem var(--gutter);
      background: var(--cream);
    }
    .card {
      width: min(420px, 100%);
      display: grid;
      gap: 1.25rem;
      padding: 2.5rem;
      background: var(--ivory);
      border: 1px solid var(--line);
    }
    h1 {
      margin: 0;
      font-size: 2.4rem;
    }
    .eyebrow {
      margin: 0;
    }
    .hint {
      color: var(--muted);
      margin: 0;
    }
    .error {
      color: #a3261b;
      margin: 0;
    }
    .back {
      justify-self: center;
    }
  `,
})
export class AdminLogin {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly next = input<string>();
  passcode = '';
  readonly error = signal('');
  readonly busy = signal(false);

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex' });
  }

  async submit(): Promise<void> {
    this.busy.set(true);
    const ok = await this.auth.unlock(this.passcode);
    this.busy.set(false);
    if (!ok) {
      this.error.set('That passcode is not correct.');
      return;
    }
    const target = this.next()?.startsWith('/admin') ? this.next()! : '/admin';
    void this.router.navigateByUrl(target);
  }
}

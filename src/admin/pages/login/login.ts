import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center p-3 page">
      <form class="card shadow border-0 login" (ngSubmit)="submit()">
        <div class="card-body p-4 p-md-5">
          <div class="d-flex align-items-center gap-2 mb-4">
            <span class="mark">K</span>
            <span class="fw-bold">Kannan Jewellery</span>
          </div>
          <h1 class="h3 fw-bold mb-1">Admin portal</h1>
          <p class="text-body-secondary mb-4">Enter the passcode to manage products, gold rates and shop details.</p>
          <div class="mb-3">
            <label class="form-label" for="passcode">Passcode</label>
            <input
              id="passcode"
              class="form-control form-control-lg"
              [class.is-invalid]="error()"
              type="password"
              name="passcode"
              [(ngModel)]="passcode"
              autocomplete="current-password"
              required
              autofocus
            />
            @if (error()) {
              <div class="invalid-feedback">{{ error() }}</div>
            }
          </div>
          <button class="btn btn-primary btn-lg w-100" type="submit" [disabled]="busy() || !passcode">
            @if (busy()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            Unlock
          </button>
          <a href="/" class="d-block text-center mt-3 small">← Back to website</a>
        </div>
      </form>
    </div>
  `,
  styles: `
    .page {
      background: #f6f5f2;
    }
    .login {
      width: min(440px, 100%);
      background: #fff;
      border-radius: 1rem;
    }
    .mark {
      width: 2.2rem;
      height: 2.2rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: linear-gradient(135deg, #b8862f, #e3c27a 50%, #a8741f);
      color: #fff;
      font-weight: 800;
    }
  `,
})
export class LoginPage {
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

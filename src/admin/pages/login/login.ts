import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center p-3 page">
      <form class="card shadow border-0 login" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="card-body p-4 p-md-5">
          <div class="d-flex align-items-center gap-2 mb-4">
            <span class="mark">K</span>
            <span class="fw-bold">Kannan Jewellery</span>
          </div>
          <h1 class="h3 fw-bold mb-1">Admin portal</h1>
          <p class="text-body-secondary mb-4">Sign in to manage products, gold rates, enquiries and shop details.</p>

          @if (error()) {
            <div class="alert alert-danger py-2" role="alert">{{ error() }}</div>
          }

          <div class="mb-3">
            <label class="form-label" for="username">Username</label>
            <input
              id="username"
              class="form-control form-control-lg"
              formControlName="username"
              autocomplete="username"
              autofocus
              [class.is-invalid]="submitted() && form.controls.username.invalid"
            />
            <div class="invalid-feedback">Enter your username.</div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <div class="input-group input-group-lg has-validation">
              <input
                id="password"
                class="form-control"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                [class.is-invalid]="submitted() && form.controls.password.invalid"
              />
              <button type="button" class="btn btn-outline-secondary" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
              <div class="invalid-feedback">Enter your password.</div>
            </div>
          </div>
          <button class="btn btn-primary btn-lg w-100" type="submit" [disabled]="busy()">
            @if (busy()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            Sign in
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
  private readonly fb = inject(FormBuilder);

  readonly next = input<string>();
  readonly error = signal('');
  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex' });
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return;
    this.busy.set(true);
    const { username, password } = this.form.getRawValue();
    const error = await this.auth.login(username, password);
    this.busy.set(false);
    if (error) {
      this.error.set(error);
      return;
    }
    const target = this.next()?.startsWith('/admin') ? this.next()! : '/admin';
    void this.router.navigateByUrl(target);
  }
}

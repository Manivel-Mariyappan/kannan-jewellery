import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AdminDataService } from '../../core/admin-data.service';
import { AdminRole, AdminUser } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import { newId } from '../../core/local-collection';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';

/** Password and confirmation must match; both may be empty when editing an existing user. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value as string;
  const c = group.get('confirmPassword')?.value as string;
  return p === c ? null : { mismatch: true };
}

@Component({
  selector: 'app-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgSelectComponent, NumbersOnlyDirective, AdminCard],
  template: `
    <div class="offcanvas-header border-bottom bg-white">
      <h2 class="offcanvas-title h5 mb-0" id="user-form-title">{{ user ? 'Edit admin user' : 'Add admin user' }}</h2>
      <button type="button" class="btn-close" aria-label="Close" (click)="offcanvas.dismiss()"></button>
    </div>

    <form class="offcanvas-body bg-body-tertiary" [formGroup]="form" (ngSubmit)="save()" id="user-form" novalidate>
      <admin-card heading="Profile" subtitle="Who this account belongs to" icon="☺" [required]="true">
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="u-name">Full name <span class="text-danger">*</span></label>
            <input id="u-name" class="form-control" formControlName="fullName" [class.is-invalid]="invalid('fullName')" />
            <div class="invalid-feedback">Full name is required.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="u-email">Email</label>
            <input id="u-email" class="form-control" type="email" formControlName="email" [class.is-invalid]="invalid('email')" />
            <div class="invalid-feedback">Enter a valid email address.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="u-mobile">Mobile</label>
            <div class="input-group">
              <span class="input-group-text">+91</span>
              <input id="u-mobile" class="form-control" type="text" maxlength="10" formControlName="mobile" appNumbersOnly [decimals]="0" [class.is-invalid]="invalid('mobile')" />
            </div>
            @if (invalid('mobile')) { <div class="invalid-feedback d-block">Enter a 10-digit mobile number.</div> }
          </div>
        </div>
      </admin-card>

      <admin-card heading="Login & access" subtitle="Username, role and status" icon="⚿" [required]="true">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="u-username">Username <span class="text-danger">*</span></label>
            <input id="u-username" class="form-control" formControlName="username" autocomplete="off" [class.is-invalid]="invalid('username')" />
            <div class="invalid-feedback">3–30 characters: letters, numbers, dot or underscore.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="u-role">Role <span class="text-danger">*</span></label>
            <ng-select labelForId="u-role" formControlName="role" [items]="roles" bindLabel="label" bindValue="value" [clearable]="false" [searchable]="false" />
          </div>
          <div class="col-12">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="u-active" formControlName="active" />
              <label class="form-check-label" for="u-active">Account active</label>
            </div>
          </div>
        </div>
      </admin-card>

      <admin-card [heading]="user ? 'Change password' : 'Password'" [subtitle]="user ? 'Leave empty to keep the current password' : 'At least 8 characters'" icon="✱" [required]="!user">
        <div class="row g-3" formGroupName="passwords">
          <div class="col-md-6">
            <label class="form-label" for="u-pass">Password</label>
            <input id="u-pass" class="form-control" type="password" formControlName="password" autocomplete="new-password" [class.is-invalid]="passwordInvalid()" />
            <div class="invalid-feedback">At least 8 characters.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="u-pass2">Confirm password</label>
            <input id="u-pass2" class="form-control" type="password" formControlName="confirmPassword" autocomplete="new-password" [class.is-invalid]="mismatch()" />
            <div class="invalid-feedback">Passwords do not match.</div>
          </div>
        </div>
        <div card-footer>Passwords are not stored in this browser. They will be sent to the Auth API and stored hashed in MySQL.</div>
      </admin-card>
    </form>

    <div class="border-top bg-white p-3 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" (click)="offcanvas.dismiss()">Cancel</button>
      <button type="submit" form="user-form" class="btn btn-primary px-4">{{ user ? 'Update user' : 'Add user' }}</button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `,
})
export class UserForm implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);
  readonly offcanvas = inject(NgbActiveOffcanvas);

  /** Set by the opener; null for a new user. */
  user: AdminUser | null = null;

  readonly roles: { value: AdminRole; label: string }[] = [
    { value: 'Admin', label: 'Admin: full access' },
    { value: 'Staff', label: 'Staff: products, gold rate and enquiries' },
  ];
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', Validators.email],
    mobile: ['', Validators.pattern(/^\d{10}$/)],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._]{3,30}$/)]],
    role: this.fb.nonNullable.control<AdminRole>('Staff'),
    active: [true],
    passwords: this.fb.nonNullable.group({ password: [''], confirmPassword: [''] }, { validators: passwordsMatch }),
  });

  ngOnInit(): void {
    const u = this.user;
    const password = this.form.controls.passwords.controls.password;
    if (u) {
      this.form.patchValue(u);
      password.setValidators(Validators.minLength(8));
    } else {
      password.setValidators([Validators.required, Validators.minLength(8)]);
    }
    password.updateValueAndValidity();
  }

  invalid(name: 'fullName' | 'email' | 'mobile' | 'username'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  passwordInvalid(): boolean {
    const c = this.form.controls.passwords.controls.password;
    return c.invalid && (c.touched || this.submitted());
  }

  mismatch(): boolean {
    const g = this.form.controls.passwords;
    return g.hasError('mismatch') && (g.controls.confirmPassword.touched || this.submitted());
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      void this.alerts.error('Please check the form', 'Some fields are missing or invalid.');
      return;
    }
    const { passwords: _passwords, ...v } = this.form.getRawValue();
    const username = v.username.toLowerCase();
    if (this.data.users.all().some((u) => u.username.toLowerCase() === username && u.id !== this.user?.id)) {
      void this.alerts.error('Username taken', `"${username}" is already used by another admin user.`);
      return;
    }
    const admins = this.data.users.all().filter((u) => u.role === 'Admin' && u.active && u.id !== this.user?.id);
    if (this.user?.role === 'Admin' && (v.role !== 'Admin' || !v.active) && admins.length === 0) {
      void this.alerts.error('Keep one admin', 'At least one active Admin account is required.');
      return;
    }
    if (this.user && !(await this.alerts.confirm('Update this user?', `${v.fullName} (${username})`))) return;
    const record: AdminUser = {
      id: this.user?.id ?? newId('usr'),
      ...v,
      username,
      lastLogin: this.user?.lastLogin ?? null,
      createdAt: this.user?.createdAt ?? new Date().toISOString(),
    };
    this.data.users.upsert(record);
    this.offcanvas.close(record);
    void this.alerts.success(this.user ? 'User updated' : 'User added', `${record.fullName} (${record.username})`);
  }
}

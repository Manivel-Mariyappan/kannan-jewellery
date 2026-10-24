import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AdminDataService } from '../../core/admin-data.service';
import { AdminUser } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import { actionButtons, adminGridTheme, badge, formatDateTime } from '../../shared/grid';
import { UiOnlyNote } from '../../shared/ui-only-note';
import { UserForm } from './user-form';

@Component({
  selector: 'app-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular, UiOnlyNote],
  template: `
    <admin-ui-only-note api="/api/users" />
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex flex-wrap align-items-center gap-2 py-3">
        <input type="search" class="form-control form-control-sm" style="max-width: 320px" placeholder="Search users…" (input)="search.set($any($event.target).value)" />
        <button type="button" class="btn btn-sm btn-primary ms-auto" (click)="open(null)">+ Add user</button>
      </div>
      <ag-grid-angular
        style="display: block; height: calc(100vh - 260px); min-height: 360px"
        [theme]="theme"
        [rowData]="data.users.all()"
        [columnDefs]="columns"
        [defaultColDef]="{ sortable: true, filter: true, resizable: true, suppressHeaderMenuButton: true }"
        [getRowId]="getRowId"
        [quickFilterText]="search()"
        [rowHeight]="52"
      />
    </div>
  `,
})
export class UsersPage {
  readonly data = inject(AdminDataService);
  private readonly offcanvas = inject(NgbOffcanvas);
  private readonly alerts = inject(AdminAlerts);

  readonly theme = adminGridTheme;
  readonly search = signal('');
  readonly getRowId = (p: { data: AdminUser }) => p.data.id;

  readonly columns: ColDef<AdminUser>[] = [
    { headerName: 'Full name', field: 'fullName', flex: 1.4, minWidth: 180 },
    { headerName: 'Username', field: 'username', width: 150 },
    { headerName: 'Email', field: 'email', flex: 1.2, minWidth: 180 },
    { headerName: 'Mobile', field: 'mobile', width: 130 },
    { headerName: 'Role', field: 'role', width: 110, cellRenderer: badge({ Admin: 'warning', Staff: 'info' }) },
    { headerName: 'Active', field: 'active', width: 95, cellDataType: 'boolean' },
    { headerName: 'Last login', field: 'lastLogin', width: 190, valueFormatter: (p) => formatDateTime(p.value as string) || 'Never' },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 150,
      sortable: false,
      filter: false,
      pinned: matchMedia('(min-width: 768px)').matches ? 'right' : null,
      cellRenderer: actionButtons<AdminUser>(
        (u) => this.open(u),
        (u) => void this.remove(u),
      ),
    },
  ];

  open(user: AdminUser | null): void {
    const ref = this.offcanvas.open(UserForm, { position: 'end', panelClass: 'kj-offcanvas-lg', backdrop: 'static', ariaLabelledBy: 'user-form-title' });
    (ref.componentInstance as UserForm).user = user;
  }

  async remove(u: AdminUser): Promise<void> {
    const otherAdmins = this.data.users.all().filter((x) => x.role === 'Admin' && x.active && x.id !== u.id);
    if (u.role === 'Admin' && otherAdmins.length === 0) {
      void this.alerts.error('Cannot delete', 'At least one active Admin account is required.');
      return;
    }
    if (!(await this.alerts.confirmDelete(`Delete ${u.fullName}?`, `The account "${u.username}" will no longer be able to log in.`))) return;
    this.data.users.remove(u.id);
    void this.alerts.toast('User deleted');
  }
}

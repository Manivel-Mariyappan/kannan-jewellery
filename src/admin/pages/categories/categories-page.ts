import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AdminDataService } from '../../core/admin-data.service';
import { AdminCategory } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import {
  actionButtons,
  adminGridTheme,
  formatDateTime,
  pinRightOnWideScreens,
  thumbnail,
} from '../../shared/grid';
import { UiOnlyNote } from '../../shared/ui-only-note';
import { CategoryForm } from './category-form';

@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular, UiOnlyNote],
  templateUrl: './categories-page.html',
})
export class CategoriesPage {
  readonly data = inject(AdminDataService);
  private readonly offcanvas = inject(NgbOffcanvas);
  private readonly alerts = inject(AdminAlerts);

  readonly theme = adminGridTheme;
  readonly search = signal('');
  readonly getRowId = (p: { data: AdminCategory }) => p.data.id;

  readonly columns: ColDef<AdminCategory>[] = [
    {
      headerName: '',
      field: 'image',
      cellDataType: false,
      width: 70,
      sortable: false,
      filter: false,
      cellRenderer: thumbnail('round'),
    },
    {
      headerName: 'Order',
      field: 'displayOrder',
      width: 115,
      sort: 'asc',
      filter: 'agNumberColumnFilter',
    },
    { headerName: 'Name', field: 'name', flex: 1.5, minWidth: 180 },
    { headerName: 'Slug', field: 'slug', flex: 1, minWidth: 140 },
    {
      headerName: 'Parent',
      colId: 'parent',
      width: 160,
      valueGetter: (p) =>
        p.data?.parentId ? (this.data.categories.get(p.data.parentId)?.name ?? '') : '—',
    },
    { headerName: 'Active', field: 'active', width: 100, cellDataType: 'boolean' },
    { headerName: 'In menu', field: 'showInMenu', width: 105, cellDataType: 'boolean' },
    {
      headerName: 'Updated',
      field: 'updatedAt',
      width: 190,
      valueFormatter: (p) => formatDateTime(p.value as string),
    },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 150,
      sortable: false,
      filter: false,
      pinned: pinRightOnWideScreens(),
      cellRenderer: actionButtons<AdminCategory>(
        (c) => this.open(c),
        (c) => void this.remove(c),
      ),
    },
  ];

  open(category: AdminCategory | null): void {
    const ref = this.offcanvas.open(CategoryForm, {
      position: 'end',
      panelClass: 'kj-offcanvas-lg',
      backdrop: 'static',
      ariaLabelledBy: 'category-form-title',
    });
    (ref.componentInstance as CategoryForm).category = category;
  }

  async remove(c: AdminCategory): Promise<void> {
    if (
      !(await this.alerts.confirmDelete(
        `Delete ${c.name}?`,
        'Products in this category are not deleted.',
      ))
    )
      return;
    this.data.categories.remove(c.id);
    void this.alerts.toast('Category deleted');
  }
}

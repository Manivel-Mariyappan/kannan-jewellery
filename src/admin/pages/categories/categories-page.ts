import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { assetUrl } from '../../../app/core/utils/download';
import { AdminDataService } from '../../core/admin-data.service';
import { AdminCategory } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import { actionButtons, adminGridTheme, formatDateTime } from '../../shared/grid';
import { UiOnlyNote } from '../../shared/ui-only-note';
import { CategoryForm } from './category-form';

@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular, UiOnlyNote],
  template: `
    <admin-ui-only-note api="/api/categories" />
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex flex-wrap align-items-center gap-2 py-3">
        <input type="search" class="form-control form-control-sm" style="max-width: 320px" placeholder="Search categories…" (input)="search.set($any($event.target).value)" />
        <button type="button" class="btn btn-sm btn-primary ms-auto" (click)="open(null)">+ Add category</button>
      </div>
      <ag-grid-angular
        style="display: block; height: calc(100vh - 260px); min-height: 400px"
        [theme]="theme"
        [rowData]="data.categories.all()"
        [columnDefs]="columns"
        [defaultColDef]="{ sortable: true, filter: true, resizable: true, suppressHeaderMenuButton: true }"
        [getRowId]="getRowId"
        [quickFilterText]="search()"
        [rowHeight]="60"
        [pagination]="true"
        [paginationPageSize]="20"
      />
    </div>
  `,
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
      cellRenderer: (p: ICellRendererParams<AdminCategory>) => {
        const img = document.createElement('img');
        img.src = p.value ? assetUrl(p.value as string) : '';
        img.alt = '';
        img.style.cssText = 'width:42px;height:42px;object-fit:cover;border-radius:50%;background:#f7f5f1;margin-top:8px';
        return img;
      },
    },
    { headerName: 'Order', field: 'displayOrder', width: 115, sort: 'asc', filter: 'agNumberColumnFilter' },
    { headerName: 'Name', field: 'name', flex: 1.5, minWidth: 180 },
    { headerName: 'Slug', field: 'slug', flex: 1, minWidth: 140 },
    {
      headerName: 'Parent',
      colId: 'parent',
      width: 160,
      valueGetter: (p) => (p.data?.parentId ? (this.data.categories.get(p.data.parentId)?.name ?? '') : '—'),
    },
    { headerName: 'Active', field: 'active', width: 100, cellDataType: 'boolean' },
    { headerName: 'In menu', field: 'showInMenu', width: 105, cellDataType: 'boolean' },
    { headerName: 'Updated', field: 'updatedAt', width: 190, valueFormatter: (p) => formatDateTime(p.value as string) },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 150,
      sortable: false,
      filter: false,
      pinned: matchMedia('(min-width: 768px)').matches ? 'right' : null,
      cellRenderer: actionButtons<AdminCategory>(
        (c) => this.open(c),
        (c) => void this.remove(c),
      ),
    },
  ];

  open(category: AdminCategory | null): void {
    const ref = this.offcanvas.open(CategoryForm, { position: 'end', panelClass: 'kj-offcanvas-lg', backdrop: 'static', ariaLabelledBy: 'category-form-title' });
    (ref.componentInstance as CategoryForm).category = category;
  }

  async remove(c: AdminCategory): Promise<void> {
    if (!(await this.alerts.confirmDelete(`Delete ${c.name}?`, 'Products in this category are not deleted.'))) return;
    this.data.categories.remove(c.id);
    void this.alerts.toast('Category deleted');
  }
}

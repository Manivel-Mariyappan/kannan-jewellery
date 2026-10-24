import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';
import { categoryName } from '../../../app/core/config/categories';
import { Product } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { assetUrl } from '../../../app/core/utils/download';
import { AdminAlerts } from '../../core/alerts.service';
import { ProductForm } from './product-form';

ModuleRegistry.registerModules([AllCommunityModule]);

type FlagKey = 'published' | 'isNew' | 'isFeatured';

@Component({
  selector: 'app-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  template: `
    <div class="row g-3 mb-3">
      @for (s of stats(); track s.label) {
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body py-3">
              <div class="small text-body-secondary">{{ s.label }}</div>
              <div class="fs-4 fw-bold">{{ s.value }}</div>
            </div>
          </div>
        </div>
      }
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white d-flex flex-wrap align-items-center gap-2 py-3">
        <input
          type="search"
          class="form-control form-control-sm search"
          placeholder="Search name, code, category…"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
        />
        <div class="ms-auto d-flex gap-2">
          @if (demoCount()) {
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeDemo()">Remove demo products</button>
          }
          <button type="button" class="btn btn-sm btn-primary" (click)="openForm(null)">+ Add product</button>
        </div>
      </div>
      <ag-grid-angular
        class="grid"
        [theme]="theme"
        [rowData]="store.products()"
        [columnDefs]="columns"
        [defaultColDef]="defaultColDef"
        [getRowId]="getRowId"
        [quickFilterText]="search()"
        [pagination]="true"
        [paginationPageSize]="20"
        [paginationPageSizeSelector]="[10, 20, 50, 100]"
        [rowHeight]="64"
        [animateRows]="true"
        (cellValueChanged)="onFlagChanged($event)"
      />
    </div>
    <p class="small text-body-secondary mt-2">
      Tick <strong>Published</strong>, <strong>New</strong> or <strong>Featured</strong> directly in the table. Click a row's Edit button to change details.
    </p>
  `,
  styles: `
    .search {
      max-width: 320px;
    }
    .grid {
      display: block;
      height: calc(100vh - 330px);
      min-height: 420px;
    }
  `,
})
export class ProductsPage {
  readonly store = inject(ContentStore);
  private readonly offcanvas = inject(NgbOffcanvas);
  private readonly alerts = inject(AdminAlerts);

  readonly search = signal('');
  readonly demoCount = computed(() => this.store.products().filter((p) => p.demo).length);
  readonly stats = computed(() => {
    const all = this.store.products();
    return [
      { label: 'Total products', value: all.length },
      { label: 'Published', value: all.filter((p) => p.published).length },
      { label: 'New arrivals', value: all.filter((p) => p.isNew).length },
      { label: 'Featured', value: all.filter((p) => p.isFeatured).length },
    ];
  });

  readonly theme = themeQuartz.withParams({
    accentColor: '#a8741f',
    fontFamily: 'Inter, system-ui, sans-serif',
    headerBackgroundColor: '#f7f5f1',
    headerFontWeight: 600,
    borderColor: '#ece8e1',
    wrapperBorder: false,
    wrapperBorderRadius: 0,
  });

  readonly getRowId = (p: GetRowIdParams<Product>) => p.data.id;

  readonly defaultColDef: ColDef<Product> = { sortable: true, filter: true, resizable: true, suppressHeaderMenuButton: true };

  readonly columns: ColDef<Product>[] = [
    {
      headerName: '',
      field: 'images',
      cellDataType: false,
      width: 76,
      sortable: false,
      filter: false,
      cellRenderer: (p: ICellRendererParams<Product>) => {
        const img = document.createElement('img');
        img.src = p.data?.images[0] ? assetUrl(p.data.images[0]) : '';
        img.alt = '';
        img.loading = 'lazy';
        img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:8px;background:#f7f5f1;margin-top:7px';
        return img;
      },
    },
    {
      headerName: 'Name',
      field: 'name',
      flex: 2,
      minWidth: 180,
      filter: 'agTextColumnFilter',
      cellRenderer: (p: ICellRendererParams<Product>) => {
        const span = document.createElement('span');
        span.textContent = p.value as string;
        if (p.data?.demo) {
          const badge = document.createElement('span');
          badge.className = 'badge text-bg-light border ms-2';
          badge.textContent = 'Demo';
          span.append(badge);
        }
        return span;
      },
    },
    { headerName: 'Code', field: 'code', width: 115 },
    {
      headerName: 'Categories',
      colId: 'categories',
      flex: 1.5,
      minWidth: 140,
      valueGetter: (p) => p.data?.categories.map(categoryName).join(', ') ?? '',
    },
    { headerName: 'Purity', field: 'purity', width: 95 },
    {
      headerName: 'Weight (g)',
      field: 'weightGrams',
      width: 110,
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
    },
    { headerName: 'Published', field: 'published', width: 110, editable: true, cellDataType: 'boolean' },
    { headerName: 'New', field: 'isNew', width: 80, editable: true, cellDataType: 'boolean' },
    { headerName: 'Featured', field: 'isFeatured', width: 100, editable: true, cellDataType: 'boolean' },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 150,
      // Pinned on wide screens; on phones it scrolls with the rest of the row.
      pinned: matchMedia('(min-width: 768px)').matches ? 'right' : null,
      sortable: false,
      filter: false,
      cellRenderer: (p: ICellRendererParams<Product>) => {
        const wrap = document.createElement('div');
        wrap.className = 'd-flex gap-1 align-items-center h-100';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn-sm btn-outline-primary';
        edit.textContent = 'Edit';
        edit.onclick = () => p.data && this.openForm(p.data);
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn btn-sm btn-outline-danger';
        del.textContent = 'Delete';
        del.onclick = () => p.data && void this.remove(p.data);
        wrap.append(edit, del);
        return wrap;
      },
    },
  ];

  /** Add (null) or edit a product in a Bootstrap offcanvas panel. */
  openForm(product: Product | null): void {
    const ref = this.offcanvas.open(ProductForm, {
      position: 'end',
      panelClass: 'kj-offcanvas-xl',
      ariaLabelledBy: 'product-form-title',
      backdrop: 'static',
    });
    (ref.componentInstance as ProductForm).product = product;
  }

  async onFlagChanged(e: CellValueChangedEvent<Product>): Promise<void> {
    const key = e.colDef.field as FlagKey;
    const value = e.newValue as boolean;
    this.save(this.store.products().map((p) => (p.id === e.data.id ? { ...p, [key]: value } : p)));
    const label = { published: value ? 'Published' : 'Unpublished', isNew: value ? 'Marked as new' : 'Removed from new', isFeatured: value ? 'Featured' : 'Removed from featured' }[key];
    void this.alerts.toast(`${label}: ${e.data.name}`);
  }

  async remove(p: Product): Promise<void> {
    if (!(await this.alerts.confirmDelete(`Delete ${p.name}?`, `Product ${p.code} will be removed from the product list.`))) return;
    this.save(this.store.products().filter((x) => x.id !== p.id));
    void this.alerts.toast('Product deleted');
  }

  async removeDemo(): Promise<void> {
    if (!(await this.alerts.confirmDelete('Remove demo products?', `All ${this.demoCount()} demo products will be removed. Your own products are kept.`))) return;
    this.save(this.store.products().filter((x) => !x.demo));
    void this.alerts.toast('Demo products removed');
  }

  private save(list: Product[]): void {
    try {
      this.store.saveDraft('products', list);
    } catch (err) {
      void this.alerts.error('Could not save', (err as Error).message);
    }
  }
}

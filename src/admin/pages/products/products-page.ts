import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
} from 'ag-grid-community';
import { categoryName } from '../../../app/core/config/categories';
import { Product } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { AdminAlerts } from '../../core/alerts.service';
import {
  actionButtons,
  adminGridTheme,
  badge,
  pinRightOnWideScreens,
  thumbnail,
} from '../../shared/grid';
import { ProductForm } from './product-form';

type FlagKey = 'published' | 'isNew' | 'isFeatured';

const FLAG_MESSAGES: Record<FlagKey, { on: string; off: string }> = {
  published: { on: 'Published', off: 'Unpublished' },
  isNew: { on: 'Marked as new', off: 'Removed from new arrivals' },
  isFeatured: { on: 'Featured', off: 'Removed from featured' },
};

@Component({
  selector: 'app-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  templateUrl: './products-page.html',
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

  readonly theme = adminGridTheme;
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

  readonly getRowId = (p: GetRowIdParams<Product>) => p.data.id;

  readonly defaultColDef: ColDef<Product> = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressHeaderMenuButton: true,
  };

  readonly columns: ColDef<Product>[] = [
    {
      headerName: '',
      colId: 'photo',
      valueGetter: (p) => p.data?.images[0] ?? '',
      width: 76,
      sortable: false,
      filter: false,
      cellRenderer: thumbnail(),
    },
    {
      headerName: 'Name',
      field: 'name',
      flex: 2,
      minWidth: 180,
      filter: 'agTextColumnFilter',
      cellRenderer: nameWithDemoBadge,
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
    {
      headerName: 'Stock',
      colId: 'stock',
      width: 140,
      valueGetter: (p) => p.data?.stockStatus ?? 'In stock',
      cellRenderer: badge({
        'In stock': 'success',
        'Made to order': 'info',
        'Out of stock': 'secondary',
      }),
    },
    {
      headerName: 'Published',
      field: 'published',
      width: 110,
      editable: true,
      cellDataType: 'boolean',
    },
    { headerName: 'New', field: 'isNew', width: 80, editable: true, cellDataType: 'boolean' },
    {
      headerName: 'Featured',
      field: 'isFeatured',
      width: 100,
      editable: true,
      cellDataType: 'boolean',
    },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 150,
      pinned: pinRightOnWideScreens(),
      sortable: false,
      filter: false,
      cellRenderer: actionButtons<Product>(
        (product) => this.openForm(product),
        (product) => void this.remove(product),
      ),
    },
  ];

  openForm(product: Product | null): void {
    const ref = this.offcanvas.open(ProductForm, {
      position: 'end',
      panelClass: 'kj-offcanvas-xl',
      ariaLabelledBy: 'product-form-title',
      backdrop: 'static',
    });
    (ref.componentInstance as ProductForm).product = product;
  }

  onFlagChanged(event: CellValueChangedEvent<Product>): void {
    const key = event.colDef.field as FlagKey;
    const isOn = event.newValue as boolean;
    const updated = this.store
      .products()
      .map((p) => (p.id === event.data.id ? { ...p, [key]: isOn } : p));
    this.save(updated);

    const message = isOn ? FLAG_MESSAGES[key].on : FLAG_MESSAGES[key].off;
    void this.alerts.toast(`${message}: ${event.data.name}`);
  }

  async remove(product: Product): Promise<void> {
    const confirmed = await this.alerts.confirmDelete(
      `Delete ${product.name}?`,
      `Product ${product.code} will be removed from the product list.`,
    );
    if (!confirmed) return;
    this.save(this.store.products().filter((p) => p.id !== product.id));
    void this.alerts.toast('Product deleted');
  }

  async removeDemo(): Promise<void> {
    const confirmed = await this.alerts.confirmDelete(
      'Remove demo products?',
      `All ${this.demoCount()} demo products will be removed. Your own products are kept.`,
    );
    if (!confirmed) return;
    this.save(this.store.products().filter((p) => !p.demo));
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

function nameWithDemoBadge(p: ICellRendererParams<Product>): HTMLElement {
  const span = document.createElement('span');
  span.textContent = String(p.value ?? '');
  if (p.data?.demo) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'badge text-bg-light border ms-2';
    badgeEl.textContent = 'Demo';
    span.append(badgeEl);
  }
  return span;
}

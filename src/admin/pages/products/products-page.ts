import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  RowClassRules,
} from 'ag-grid-community';
import { CATEGORIES, categoryName } from '../../../app/core/config/categories';
import { Product } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { AdminAlerts } from '../../core/alerts.service';
import {
  adminGridTheme,
  badge,
  pinRightOnWideScreens,
  rowButtons,
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
  imports: [AgGridAngular, FormsModule, NgSelectComponent],
  templateUrl: './products-page.html',
  styles: `
    .grid {
      display: block;
      height: calc(100vh - 420px);
      min-height: 420px;
    }
  `,
})
export class ProductsPage {
  readonly store = inject(ContentStore);
  private readonly offcanvas = inject(NgbOffcanvas);
  private readonly alerts = inject(AdminAlerts);

  readonly theme = adminGridTheme;
  readonly categories = CATEGORIES.filter((c) => !c.virtual);

  // Filters
  readonly name = signal('');
  readonly code = signal('');
  readonly category = signal<string | null>(null);
  readonly onlyPublished = signal(false);
  readonly onlyNew = signal(false);
  readonly onlyFeatured = signal(false);
  readonly showDeleted = signal(false);

  readonly activeProducts = computed(() => this.store.products().filter((p) => !p.deleted));
  readonly deletedCount = computed(
    () => this.store.products().length - this.activeProducts().length,
  );
  readonly demoCount = computed(() => this.activeProducts().filter((p) => p.demo).length);

  readonly rows = computed(() => {
    const name = this.name().trim().toLowerCase();
    const code = this.code().trim().toLowerCase();
    const category = this.category();

    return this.store.products().filter((p) => {
      if (p.deleted && !this.showDeleted()) return false;
      if (name && !p.name.toLowerCase().includes(name)) return false;
      if (code && !p.code.toLowerCase().includes(code)) return false;
      if (category && !p.categories.includes(category)) return false;
      if (this.onlyPublished() && !p.published) return false;
      if (this.onlyNew() && !p.isNew) return false;
      if (this.onlyFeatured() && !p.isFeatured) return false;
      return true;
    });
  });

  readonly hasFilters = computed(
    () =>
      !!(this.name() || this.code() || this.category()) ||
      this.onlyPublished() ||
      this.onlyNew() ||
      this.onlyFeatured() ||
      this.showDeleted(),
  );

  readonly stats = computed(() => {
    const active = this.activeProducts();
    return [
      { label: 'Products', value: active.length },
      { label: 'Published', value: active.filter((p) => p.published).length },
      { label: 'New arrivals', value: active.filter((p) => p.isNew).length },
      { label: 'Featured', value: active.filter((p) => p.isFeatured).length },
      { label: 'Deleted', value: this.deletedCount() },
    ];
  });

  readonly getRowId = (p: GetRowIdParams<Product>) => p.data.id;

  readonly rowClassRules: RowClassRules<Product> = {
    'row-deleted': (p) => !!p.data?.deleted,
  };

  readonly defaultColDef: ColDef<Product> = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressHeaderMenuButton: true,
  };

  // Ticking flags on a deleted product would be confusing, so only allow it on active ones.
  private readonly editableIfActive = (p: { data?: Product }) => !p.data?.deleted;

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
      cellRenderer: nameWithBadges,
    },
    { headerName: 'Code', field: 'code', width: 110 },
    {
      headerName: 'Categories',
      colId: 'categories',
      flex: 1.5,
      minWidth: 120,
      valueGetter: (p) => p.data?.categories.map(categoryName).join(', ') ?? '',
    },
    {
      headerName: 'Purity, wt',
      colId: 'purityWeight',
      width: 140,
      valueGetter: (p) =>
        [p.data?.purity, p.data?.weightGrams ? `${p.data.weightGrams} g` : null]
          .filter(Boolean)
          .join(' · '),
    },
    {
      headerName: 'Stock',
      colId: 'stock',
      width: 110,
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
      editable: this.editableIfActive,
      cellDataType: 'boolean',
    },
    {
      headerName: 'New',
      field: 'isNew',
      width: 80,
      editable: this.editableIfActive,
      cellDataType: 'boolean',
    },
    {
      headerName: 'Featured',
      field: 'isFeatured',
      width: 100,
      editable: this.editableIfActive,
      cellDataType: 'boolean',
    },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 176,
      pinned: pinRightOnWideScreens(),
      sortable: false,
      filter: false,
      cellRenderer: rowButtons<Product>((product) =>
        product.deleted
          ? [
              {
                label: 'Restore',
                className: 'btn-outline-success',
                onClick: (p) => void this.restore(p),
              },
              {
                label: 'Remove',
                className: 'btn-outline-danger',
                onClick: (p) => void this.deleteForever(p),
              },
            ]
          : [
              { label: 'Edit', className: 'btn-outline-primary', onClick: (p) => this.openForm(p) },
              {
                label: 'Delete',
                className: 'btn-outline-danger',
                onClick: (p) => void this.remove(p),
              },
            ],
      ),
    },
  ];

  clearFilters(): void {
    this.name.set('');
    this.code.set('');
    this.category.set(null);
    this.onlyPublished.set(false);
    this.onlyNew.set(false);
    this.onlyFeatured.set(false);
    this.showDeleted.set(false);
  }

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
    this.update(event.data.id, { [key]: isOn });

    const message = isOn ? FLAG_MESSAGES[key].on : FLAG_MESSAGES[key].off;
    void this.alerts.toast(`${message}: ${event.data.name}`);
  }

  // Deleting only hides the product. It can be restored with "Show deleted".
  async remove(product: Product): Promise<void> {
    const confirmed = await this.alerts.confirmDelete(
      `Delete ${product.name}?`,
      `It will be removed from the website. You can restore it later by ticking "Show deleted".`,
    );
    if (!confirmed) return;
    this.update(product.id, { deleted: true, deletedAt: new Date().toISOString() });
    void this.alerts.toast('Product deleted');
  }

  async restore(product: Product): Promise<void> {
    const confirmed = await this.alerts.confirm(
      `Restore ${product.name}?`,
      'The product will be active again. Publish it when it should appear on the website.',
      'Yes, restore',
    );
    if (!confirmed) return;
    this.update(product.id, { deleted: false, deletedAt: null });
    void this.alerts.toast(`Restored: ${product.name}`);
  }

  async deleteForever(product: Product): Promise<void> {
    const confirmed = await this.alerts.confirmDelete(
      `Delete ${product.name} permanently?`,
      `${product.code} will be removed completely and cannot be restored.`,
    );
    if (!confirmed) return;
    this.save(this.store.products().filter((p) => p.id !== product.id));
    void this.alerts.toast('Product deleted permanently');
  }

  async removeDemo(): Promise<void> {
    const confirmed = await this.alerts.confirmDelete(
      'Delete demo products?',
      `All ${this.demoCount()} demo products will be deleted. Your own products are kept.`,
    );
    if (!confirmed) return;
    const deletedAt = new Date().toISOString();
    this.save(this.store.products().map((p) => (p.demo ? { ...p, deleted: true, deletedAt } : p)));
    void this.alerts.toast('Demo products deleted');
  }

  private update(id: string, changes: Partial<Product>): void {
    this.save(this.store.products().map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }

  private save(list: Product[]): void {
    try {
      this.store.saveDraft('products', list);
    } catch (err) {
      void this.alerts.error('Could not save', (err as Error).message);
    }
  }
}

function nameWithBadges(p: ICellRendererParams<Product>): HTMLElement {
  const span = document.createElement('span');
  span.textContent = String(p.value ?? '');

  const addBadge = (text: string, className: string) => {
    const el = document.createElement('span');
    el.className = `badge ms-2 ${className}`;
    el.textContent = text;
    span.append(el);
  };
  if (p.data?.deleted) addBadge('Deleted', 'text-bg-danger');
  if (p.data?.demo) addBadge('Demo', 'text-bg-light border');
  return span;
}

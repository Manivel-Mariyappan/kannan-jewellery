import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../../core/config/categories';
import { Product } from '../../core/models';
import { ContentStore } from '../../core/services/content-store';
import { assetUrl } from '../../core/utils/download';

@Component({
  selector: 'app-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="admin-head">
      <div>
        <h1>Products</h1>
        <p>{{ products().length }} total · {{ publishedCount() }} published · {{ demoCount() }} demo</p>
      </div>
      <div class="admin-actions">
        <input class="input" type="search" placeholder="Search name or code" [value]="search()" (input)="search.set($any($event.target).value)" style="width: 220px" />
        @if (demoCount()) {
          <button type="button" class="btn btn-danger btn-sm" (click)="removeDemo()">Remove demo products</button>
        }
        <a class="btn btn-gold btn-sm" routerLink="new">+ Add product</a>
      </div>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Name / code</th>
            <th>Categories</th>
            <th>Purity · weight</th>
            <th>Published</th>
            <th>New</th>
            <th>Featured</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of filtered(); track p.id) {
            <tr>
              <td><img [src]="thumb(p)" alt="" loading="lazy" /></td>
              <td>
                <a [routerLink]="p.id"><strong>{{ p.name }}</strong></a><br />
                <small>{{ p.code }}</small>
                @if (p.demo) { <span class="tag" style="margin-left: 0.4rem">Demo</span> }
              </td>
              <td><small>{{ categoryNames(p) }}</small></td>
              <td>{{ p.purity ?? '—' }} · {{ p.weightGrams ? p.weightGrams + ' g' : '—' }}</td>
              <td><input type="checkbox" [checked]="p.published" (change)="toggle(p, 'published')" [attr.aria-label]="'Published: ' + p.name" /></td>
              <td><input type="checkbox" [checked]="p.isNew" (change)="toggle(p, 'isNew')" [attr.aria-label]="'New arrival: ' + p.name" /></td>
              <td><input type="checkbox" [checked]="p.isFeatured" (change)="toggle(p, 'isFeatured')" [attr.aria-label]="'Featured: ' + p.name" /></td>
              <td>
                <div class="admin-actions">
                  <a class="btn btn-outline btn-sm" [routerLink]="p.id">Edit</a>
                  <button type="button" class="btn btn-danger btn-sm" (click)="remove(p)">Delete</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8">No products found.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminProducts {
  private readonly store = inject(ContentStore);

  readonly products = this.store.products;
  readonly search = signal('');
  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = [...this.products()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return term ? list.filter((p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term)) : list;
  });
  readonly publishedCount = computed(() => this.products().filter((p) => p.published).length);
  readonly demoCount = computed(() => this.products().filter((p) => p.demo).length);

  thumb(p: Product): string {
    return p.images[0] ? assetUrl(p.images[0]) : '';
  }

  categoryNames(p: Product): string {
    return p.categories.map(categoryName).join(', ');
  }

  toggle(p: Product, key: 'published' | 'isNew' | 'isFeatured'): void {
    this.save(this.products().map((x) => (x.id === p.id ? { ...x, [key]: !x[key] } : x)));
  }

  remove(p: Product): void {
    if (!confirm(`Delete "${p.name}" (${p.code})? This removes it from the draft product list.`)) return;
    this.save(this.products().filter((x) => x.id !== p.id));
  }

  removeDemo(): void {
    if (!confirm(`Remove all ${this.demoCount()} demo products? Your own products are kept.`)) return;
    this.save(this.products().filter((x) => !x.demo));
  }

  private save(list: Product[]): void {
    try {
      this.store.saveDraft('products', list);
    } catch (err) {
      alert((err as Error).message);
    }
  }
}

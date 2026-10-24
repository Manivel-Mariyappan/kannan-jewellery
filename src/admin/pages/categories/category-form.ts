import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { assetUrl, slugify } from '../../../app/core/utils/download';
import { AdminDataService } from '../../core/admin-data.service';
import { AdminCategory } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import { resizeToWebp } from '../../core/image-resize';
import { newId } from '../../core/local-collection';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';

@Component({
  selector: 'app-category-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgSelectComponent, NumbersOnlyDirective, AdminCard],
  template: `
    <div class="offcanvas-header border-bottom bg-white">
      <h2 class="offcanvas-title h5 mb-0" id="category-form-title">{{ category ? 'Edit category' : 'Add category' }}</h2>
      <button type="button" class="btn-close" aria-label="Close" (click)="offcanvas.dismiss()"></button>
    </div>

    <form class="offcanvas-body bg-body-tertiary" [formGroup]="form" (ngSubmit)="save()" id="category-form" novalidate>
      <admin-card heading="Category details" subtitle="Name and web address" icon="◆" [required]="true">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="c-name">Category name <span class="text-danger">*</span></label>
            <input id="c-name" class="form-control" formControlName="name" [class.is-invalid]="invalid('name')" placeholder="e.g. Gold Necklaces" />
            <div class="invalid-feedback">Category name is required.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="c-slug">URL slug <span class="text-danger">*</span></label>
            <input id="c-slug" class="form-control" formControlName="slug" [class.is-invalid]="invalid('slug')" />
            <div class="form-text">/collections/{{ form.controls.slug.value || '…' }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="c-parent">Parent category</label>
            <ng-select labelForId="c-parent" formControlName="parentId" [items]="parents()" bindLabel="name" bindValue="id" placeholder="None (top level)" />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="c-order">Display order</label>
            <input id="c-order" class="form-control" type="text" formControlName="displayOrder" appNumbersOnly [decimals]="0" />
          </div>
          <div class="col-12">
            <label class="form-label" for="c-desc">Description</label>
            <textarea id="c-desc" class="form-control" rows="3" formControlName="description"></textarea>
          </div>
        </div>
      </admin-card>

      <admin-card heading="Category image" subtitle="Shown in the category menu and on the home page" icon="▣">
        <label card-actions class="btn btn-sm btn-primary mb-0">
          Upload image
          <input #file type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="upload(file)" />
        </label>
        <div class="d-flex align-items-center gap-3">
          @if (image()) {
            <img [src]="assetUrl(image())" alt="" class="rounded-3 border" width="96" height="96" style="object-fit: cover" />
          } @else {
            <div class="rounded-3 border border-dashed d-grid text-body-secondary small" style="width: 96px; height: 96px; place-items: center">No image</div>
          }
          <input class="form-control" placeholder="or image path, e.g. images/necklaces.webp" [value]="image().startsWith('data:') ? '' : image()" (change)="image.set($any($event.target).value.trim())" />
        </div>
      </admin-card>

      <admin-card heading="Visibility" icon="◉">
        <div class="vstack gap-2">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="c-active" formControlName="active" />
            <label class="form-check-label" for="c-active">Active</label>
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="c-menu" formControlName="showInMenu" />
            <label class="form-check-label" for="c-menu">Show in website menu</label>
          </div>
        </div>
      </admin-card>

      <admin-card heading="SEO" subtitle="Search engine title and description" icon="⌕">
        <div class="mb-3">
          <label class="form-label" for="c-mt">Meta title</label>
          <input id="c-mt" class="form-control" formControlName="metaTitle" maxlength="70" />
          <div class="form-text">{{ form.controls.metaTitle.value.length }}/70</div>
        </div>
        <div>
          <label class="form-label" for="c-md">Meta description</label>
          <textarea id="c-md" class="form-control" rows="2" formControlName="metaDescription" maxlength="160"></textarea>
          <div class="form-text">{{ form.controls.metaDescription.value.length }}/160</div>
        </div>
      </admin-card>
    </form>

    <div class="border-top bg-white p-3 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" (click)="offcanvas.dismiss()">Cancel</button>
      <button type="submit" form="category-form" class="btn btn-primary px-4">{{ category ? 'Update category' : 'Add category' }}</button>
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
export class CategoryForm implements OnInit {
  private readonly data = inject(AdminDataService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);
  readonly offcanvas = inject(NgbActiveOffcanvas);
  readonly assetUrl = assetUrl;

  /** Set by the opener; null for a new category. */
  category: AdminCategory | null = null;

  readonly image = signal('');
  readonly submitted = signal(false);
  readonly parents = computed(() => this.data.categories.all().filter((c) => c.id !== this.category?.id));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    parentId: this.fb.control<string | null>(null),
    displayOrder: this.fb.control<string | number | null>(null),
    description: [''],
    active: [true],
    showInMenu: [true],
    metaTitle: [''],
    metaDescription: [''],
  });

  ngOnInit(): void {
    const c = this.category;
    if (c) {
      this.form.patchValue(c);
      this.image.set(c.image);
    } else {
      this.form.controls.displayOrder.setValue(this.data.categories.all().length + 1);
    }
    this.form.controls.name.valueChanges.subscribe((name) => {
      if (!c && !this.form.controls.slug.dirty) this.form.controls.slug.setValue(slugify(name));
    });
  }

  invalid(name: 'name' | 'slug'): boolean {
    const ctrl = this.form.controls[name];
    return ctrl.invalid && (ctrl.touched || this.submitted());
  }

  async upload(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (file) this.image.set(await resizeToWebp(file, 600));
    input.value = '';
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) {
      void this.alerts.error('Please check the form', 'Category name and URL slug are required.');
      return;
    }
    const v = this.form.getRawValue();
    if (this.data.categories.all().some((c) => c.slug === v.slug && c.id !== this.category?.id)) {
      void this.alerts.error('Duplicate URL slug', `"${v.slug}" is already used by another category.`);
      return;
    }
    if (this.category && !(await this.alerts.confirm('Update this category?', v.name))) return;
    const record: AdminCategory = {
      id: this.category?.id ?? newId('cat'),
      ...v,
      displayOrder: Number(v.displayOrder) || 0,
      image: this.image(),
      updatedAt: new Date().toISOString(),
    };
    this.data.categories.upsert(record);
    this.offcanvas.close(record);
    void this.alerts.success(this.category ? 'Category updated' : 'Category added', record.name);
  }
}

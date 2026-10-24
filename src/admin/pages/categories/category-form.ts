import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { assetUrl, slugify } from '../../../app/core/utils/url';
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
  templateUrl: './category-form.html',
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

  // null when adding a new category
  category: AdminCategory | null = null;

  readonly image = signal('');
  readonly submitted = signal(false);
  readonly parents = computed(() =>
    this.data.categories.all().filter((c) => c.id !== this.category?.id),
  );

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
      void this.alerts.error(
        'Duplicate URL slug',
        `"${v.slug}" is already used by another category.`,
      );
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

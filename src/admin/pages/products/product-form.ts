import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CATEGORIES } from '../../../app/core/config/categories';
import { GemTone, Model3d, ProceduralShape, Product, Purity } from '../../../app/core/models';
import { ContentStore } from '../../../app/core/services/content-store';
import { assetUrl, slugify } from '../../../app/core/utils/download';
import { JewelleryViewer } from '../../../app/shared/jewellery-viewer/jewellery-viewer';
import { AdminAlerts } from '../../core/alerts.service';
import { resizeToWebp } from '../../core/image-resize';
import { NumbersOnlyDirective } from '../../core/numbers-only.directive';
import { AdminCard } from '../../shared/admin-card';

type ModelKind = 'none' | 'gltf' | 'procedural';

/** Add / edit product form, opened inside a Bootstrap offcanvas from the products grid. */
@Component({
  selector: 'app-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgSelectComponent, JewelleryViewer, NumbersOnlyDirective, AdminCard],
  templateUrl: './product-form.html',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .offcanvas-body {
      background: #f6f5f2;
    }
    .images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
      gap: 0.6rem;
    }
    .images figure {
      margin: 0;
      overflow: hidden;
      border: 1px solid #e7e3dc;
      border-radius: 0.5rem;
      background: #fff;
    }
    .images img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
      background: #f7f5f1;
    }
    .images figcaption {
      display: flex;
      justify-content: space-between;
    }
    .images .main-badge {
      font-size: 0.65rem;
    }
    .preview {
      aspect-ratio: 1;
      border-radius: 0.5rem;
      overflow: hidden;
    }
  `,
})
export class ProductForm implements OnInit {
  private readonly store = inject(ContentStore);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AdminAlerts);
  readonly offcanvas = inject(NgbActiveOffcanvas);

  /** Set by the opener before the first render; null for a new product. */
  product: Product | null = null;

  readonly categories = CATEGORIES.filter((c) => !c.virtual);
  readonly purities: Purity[] = ['24K', '22K', '18K', '14K'];
  readonly modelKinds: { value: ModelKind; label: string }[] = [
    { value: 'none', label: 'None (photographs only)' },
    { value: 'gltf', label: 'GLB / GLTF model file' },
    { value: 'procedural', label: 'Demo model (generated)' },
  ];
  readonly shapes: { value: ProceduralShape; label: string }[] = [
    { value: 'necklace', label: 'Necklace' },
    { value: 'bridal', label: 'Bridal haram (layered)' },
    { value: 'antique', label: 'Antique medallion' },
    { value: 'chain', label: 'Chain' },
    { value: 'bangle', label: 'Bangle / kada' },
    { value: 'ring', label: 'Ring' },
    { value: 'earring', label: 'Jhumka earrings' },
  ];
  readonly gems: { value: GemTone; label: string }[] = [
    { value: 'ruby', label: 'Ruby' },
    { value: 'emerald', label: 'Emerald' },
    { value: 'pearl', label: 'Pearl' },
  ];
  readonly assetUrl = assetUrl;

  readonly images = signal<string[]>([]);
  readonly uploading = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: ['', Validators.maxLength(800)],
    categories: this.fb.nonNullable.control<string[]>([], Validators.required),
    purity: this.fb.control<Purity | null>('22K'),
    weightGrams: this.fb.control<string | number | null>(null),
    isNew: [true],
    isFeatured: [false],
    published: [true],
    demo: [false],
    modelKind: this.fb.nonNullable.control<ModelKind>('none'),
    gltfUrl: [''],
    shape: this.fb.nonNullable.control<ProceduralShape>('necklace'),
    gem: this.fb.nonNullable.control<GemTone>('ruby'),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly modelKind = computed(() => this.value().modelKind);

  /** Live 3D preview; only changes when the model itself changes. */
  readonly previewModel = computed<Model3d | null>(
    () => {
      const model = this.buildModel(this.value() as ReturnType<typeof this.form.getRawValue>);
      return model?.type === 'gltf' && !/\.(glb|gltf)$/i.test(model.url) ? null : model;
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  ngOnInit(): void {
    const p = this.product;
    if (p) {
      this.form.setValue({
        name: p.name,
        code: p.code,
        slug: p.slug,
        description: p.description,
        categories: [...p.categories],
        purity: p.purity,
        weightGrams: p.weightGrams,
        isNew: p.isNew,
        isFeatured: p.isFeatured,
        published: p.published,
        demo: p.demo,
        modelKind: p.model3d?.type ?? 'none',
        gltfUrl: p.model3d?.type === 'gltf' ? p.model3d.url : '',
        shape: p.model3d?.type === 'procedural' ? p.model3d.shape : 'necklace',
        gem: p.model3d?.type === 'procedural' ? (p.model3d.gem ?? 'ruby') : 'ruby',
      });
      this.images.set([...p.images]);
    }
    // Keep the URL slug in step with the name for new products until it is edited by hand.
    this.form.controls.name.valueChanges.subscribe((name) => {
      if (!p && !this.form.controls.slug.dirty) this.form.controls.slug.setValue(slugify(name));
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  async upload(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    this.uploading.set(true);
    try {
      const urls = await Promise.all(files.map((f) => resizeToWebp(f)));
      this.images.update((list) => [...list, ...urls]);
    } catch (err) {
      console.error(err);
      void this.alerts.error('Image not added', 'Could not read one of the images. Try a JPG, PNG or WebP file.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  addImagePath(input: HTMLInputElement): void {
    const path = input.value.trim().replace(/^\/+/, '');
    if (path) this.images.update((list) => [...list, path]);
    input.value = '';
  }

  moveImage(i: number, delta: number): void {
    this.images.update((list) => {
      const next = [...list];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      return next;
    });
  }

  removeImage(i: number): void {
    this.images.update((list) => list.filter((_, idx) => idx !== i));
  }

  private buildModel(v: ReturnType<typeof this.form.getRawValue>): Model3d | null {
    if (v.modelKind === 'gltf' && v.gltfUrl.trim()) return { type: 'gltf', url: v.gltfUrl.trim().replace(/^\/+/, '') };
    if (v.modelKind === 'procedural') return { type: 'procedural', shape: v.shape, gem: v.gem };
    return null;
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      void this.alerts.error('Please check the form', 'Some required fields are missing or invalid.');
      return;
    }
    const v = this.form.getRawValue();
    const others = this.store.products().filter((p) => p.id !== this.product?.id);
    const code = v.code.trim().toUpperCase();
    if (others.some((p) => p.code.toUpperCase() === code)) {
      void this.alerts.error('Duplicate product code', `${code} is already used by another product.`);
      return;
    }
    if (others.some((p) => p.slug === v.slug)) {
      void this.alerts.error('Duplicate web address', `"${v.slug}" is already used. Change the URL slug.`);
      return;
    }
    const weight = v.weightGrams === null || v.weightGrams === '' ? null : Number(v.weightGrams);

    if (this.product && !(await this.alerts.confirm('Update this product?', `${v.name} (${code}) will be updated.`))) return;

    const product: Product = {
      id: this.product?.id ?? `${slugify(code)}-${Date.now().toString(36)}`,
      slug: v.slug,
      code,
      name: v.name.trim(),
      description: v.description.trim(),
      categories: v.categories,
      weightGrams: weight !== null && Number.isFinite(weight) ? weight : null,
      purity: v.purity ?? null,
      images: this.images(),
      model3d: this.buildModel(v),
      isNew: v.isNew,
      isFeatured: v.isFeatured,
      published: v.published,
      demo: v.demo,
      createdAt: this.product?.createdAt ?? new Date().toISOString().slice(0, 10),
    };
    const list = this.product
      ? this.store.products().map((p) => (p.id === product.id ? product : p))
      : [product, ...this.store.products()];
    try {
      this.store.saveDraft('products', list);
    } catch (err) {
      void this.alerts.error('Could not save', (err as Error).message);
      return;
    }
    this.offcanvas.close(product);
    void this.alerts.success(this.product ? 'Product updated' : 'Product added', `${product.name} (${product.code})`);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config/categories';
import { GemTone, Model3d, ProceduralShape, Product, Purity } from '../../core/models';
import { ContentStore } from '../../core/services/content-store';
import { assetUrl, slugify } from '../../core/utils/download';
import { resizeToWebp } from '../../core/utils/image-resize';
import { JewelleryViewer } from '../../shared/jewellery-viewer/jewellery-viewer';

type ModelKind = 'none' | 'gltf' | 'procedural';

@Component({
  selector: 'app-admin-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, JewelleryViewer],
  templateUrl: './admin-product-form.html',
  styles: `
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
      gap: 1.5rem;
      align-items: start;
    }
    .preview {
      position: sticky;
      top: 1rem;
    }
    .preview app-jewellery-viewer {
      aspect-ratio: 4 / 5;
    }
    .cats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 0.5rem 1rem;
    }
    .images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .images figure {
      margin: 0;
      border: 1px solid var(--line);
      background: var(--cream);
    }
    .images img {
      width: 100%;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      display: block;
    }
    .images figcaption {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem;
      background: #fff;
    }
    .images button {
      border: 0;
      background: none;
      padding: 0.2rem 0.4rem;
      color: var(--brown);
    }
    .images button:disabled {
      opacity: 0.3;
    }
    .row {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .row .input {
      flex: 1 1 220px;
    }
    .full {
      grid-column: 1 / -1;
    }
    @media (max-width: 1000px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .preview {
        position: static;
      }
    }
  `,
})
export class AdminProductForm implements OnInit {
  private readonly store = inject(ContentStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Route param; undefined for /products/new. */
  readonly id = input<string>();

  readonly categories = CATEGORIES.filter((c) => !c.virtual);
  readonly purities: Purity[] = ['24K', '22K', '18K', '14K'];
  readonly shapes: ProceduralShape[] = ['necklace', 'bridal', 'antique', 'chain', 'bangle', 'ring', 'earring'];
  readonly gems: GemTone[] = ['ruby', 'emerald', 'pearl'];
  readonly assetUrl = assetUrl;

  readonly existing = computed(() => this.store.products().find((p) => p.id === this.id()));
  readonly images = signal<string[]>([]);
  readonly error = signal('');
  readonly uploading = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: ['', Validators.maxLength(800)],
    categories: this.fb.nonNullable.control<string[]>([], Validators.required),
    purity: this.fb.nonNullable.control<Purity | ''>('22K'),
    weightGrams: this.fb.control<number | null>(null, Validators.min(0)),
    isNew: [true],
    isFeatured: [false],
    published: [true],
    demo: [false],
    modelKind: this.fb.nonNullable.control<ModelKind>('none'),
    gltfUrl: [''],
    shape: this.fb.nonNullable.control<ProceduralShape>('necklace'),
    gem: this.fb.nonNullable.control<GemTone>('ruby'),
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Live 3D preview of the model settings. Only changes when the model itself changes. */
  readonly previewModel = computed<Model3d | null>(
    () => {
      const model = this.buildModel(this.formValue() as ReturnType<typeof this.form.getRawValue>);
      // Don't try to load half-typed paths.
      return model?.type === 'gltf' && !/\.(glb|gltf)$/i.test(model.url) ? null : model;
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  ngOnInit(): void {
    const p = this.existing();
    if (this.id() && !p) {
      this.error.set('This product no longer exists.');
      return;
    }
    if (p) {
      this.form.setValue({
        name: p.name,
        code: p.code,
        slug: p.slug,
        description: p.description,
        categories: [...p.categories],
        purity: p.purity ?? '',
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
    // Keep the slug in step with the name for new products until it is edited by hand.
    this.form.controls.name.valueChanges.subscribe((name) => {
      if (!p && !this.form.controls.slug.dirty) this.form.controls.slug.setValue(slugify(name));
    });
  }

  toggleCategory(slug: string, checked: boolean): void {
    const ctrl = this.form.controls.categories;
    ctrl.setValue(checked ? [...ctrl.value, slug] : ctrl.value.filter((c) => c !== slug));
    ctrl.markAsTouched();
  }

  async upload(input: HTMLInputElement): Promise<void> {
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.uploading.set(true);
    try {
      const urls = await Promise.all(files.filter((f) => f.type.startsWith('image/')).map((f) => resizeToWebp(f)));
      this.images.update((list) => [...list, ...urls]);
    } catch (err) {
      this.error.set('Could not read one of the images. Try a JPG, PNG or WebP file.');
      console.error(err);
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

  save(): void {
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Please fix the highlighted fields.');
      return;
    }
    const v = this.form.getRawValue();
    const others = this.store.products().filter((p) => p.id !== this.existing()?.id);
    const code = v.code.trim().toUpperCase();
    if (others.some((p) => p.code.toUpperCase() === code)) {
      this.error.set(`Product code ${code} is already used by another product.`);
      return;
    }
    if (others.some((p) => p.slug === v.slug)) {
      this.error.set(`The web address "${v.slug}" is already used. Change the URL slug.`);
      return;
    }

    const product: Product = {
      id: this.existing()?.id ?? `${slugify(code)}-${Date.now().toString(36)}`,
      slug: v.slug,
      code,
      name: v.name.trim(),
      description: v.description.trim(),
      categories: v.categories,
      weightGrams: v.weightGrams ?? null,
      purity: v.purity || null,
      images: this.images(),
      model3d: this.buildModel(v),
      isNew: v.isNew,
      isFeatured: v.isFeatured,
      published: v.published,
      demo: v.demo,
      createdAt: this.existing()?.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    const list = this.existing()
      ? this.store.products().map((p) => (p.id === product.id ? product : p))
      : [product, ...this.store.products()];
    try {
      this.store.saveDraft('products', list);
      void this.router.navigate(['/admin/products']);
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }
}

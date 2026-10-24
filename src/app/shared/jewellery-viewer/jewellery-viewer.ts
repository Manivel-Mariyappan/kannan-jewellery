import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Model3d } from '../../core/models';
import { MotionService } from '../../core/services/motion.service';
import { assetUrl } from '../../core/utils/download';
import type { ViewerEngine } from './viewer-engine';
import { canRender3d } from './webgl-support';

type ViewerState = 'idle' | 'loading' | 'ready' | 'fallback';

/**
 * Interactive 3D jewellery viewer with a photographic fallback.
 *
 * - Three.js is only downloaded when the viewer approaches the viewport.
 * - Rendering pauses while the viewer is off-screen.
 * - Without WebGL, on save-data/low-memory devices, or if a model fails to load, the poster
 *   image stays in place with a short explanation.
 */
@Component({
  selector: 'app-jewellery-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './jewellery-viewer.html',
  styleUrl: './jewellery-viewer.scss',
  host: {
    '[class.dark]': 'tone() === "dark"',
    '[class.ready]': 'state() === "ready"',
  },
})
export class JewelleryViewer {
  readonly model = input<Model3d | null>(null);
  readonly poster = input<string>('');
  readonly alt = input<string>('Gold jewellery');
  readonly interactive = input(true);
  readonly autoRotate = input(true);
  readonly tone = input<'light' | 'dark'>('light');
  /** Show the "demo model" caption for procedurally generated pieces. */
  readonly showModelNote = input(true);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly state = signal<ViewerState>('idle');
  readonly fallbackReason = signal('');
  readonly autoRotating = signal(true);
  readonly posterUrl = computed(() => (this.poster() ? assetUrl(this.poster()) : ''));
  readonly isProcedural = computed(() => this.model()?.type === 'procedural');

  private engine: ViewerEngine | null = null;
  private engineLoading: Promise<ViewerEngine | null> | null = null;
  private visible = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.host.nativeElement as HTMLElement;
      const io = new IntersectionObserver(
        ([entry]) => {
          this.visible = entry.isIntersecting;
          if (this.visible) void this.ensureEngine().then((e) => e?.start());
          else this.engine?.stop();
        },
        { rootMargin: '200px 0px' },
      );
      io.observe(el);
      const ro = new ResizeObserver(() => this.engine?.resize());
      ro.observe(el);
      const onVisibility = () => (document.hidden ? this.engine?.stop() : this.visible && this.engine?.start());
      document.addEventListener('visibilitychange', onVisibility);

      destroyRef.onDestroy(() => {
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        this.engine?.dispose();
        this.engine = null;
      });
    });

    // Swap pieces when the model input changes (e.g. in the showroom carousel).
    effect(() => {
      const model = this.model();
      untracked(() => {
        if (!model) return;
        if (this.engine) {
          void this.present(this.engine, model);
        } else if (this.state() === 'fallback' && this.visible && canRender3d()) {
          // A previous model failed; try again with the new one.
          this.state.set('idle');
          void this.ensureEngine().then((e) => e?.start());
        }
      });
    });
  }

  private ensureEngine(): Promise<ViewerEngine | null> {
    if (this.engine) return Promise.resolve(this.engine);
    const model = this.model();
    if (!model) return Promise.resolve(null);
    if (!canRender3d()) {
      this.fail('3D view is not available on this device, so we are showing a photograph.');
      return Promise.resolve(null);
    }
    this.engineLoading ??= (async () => {
      this.state.set('loading');
      try {
        const { ViewerEngine } = await import('./viewer-engine');
        const engine = new ViewerEngine(this.canvas().nativeElement, {
          interactive: this.interactive(),
          autoRotate: this.autoRotate(),
          reducedMotion: this.motion.reduced(),
          onContextLost: () => this.fail('The 3D view was interrupted, so we are showing a photograph.'),
        });
        this.engine = engine;
        this.autoRotating.set(engine.autoRotating);
        await this.present(engine, this.model() ?? model);
        return engine;
      } catch (err) {
        console.error('[viewer] could not start 3D view', err);
        this.fail('The 3D model could not be loaded, so we are showing a photograph.');
        return null;
      }
    })();
    return this.engineLoading;
  }

  private async present(engine: ViewerEngine, model: Model3d): Promise<void> {
    try {
      await engine.show(model.type === 'gltf' ? { ...model, url: assetUrl(model.url) } : model);
      this.state.set('ready');
    } catch (err) {
      console.error('[viewer] model failed', err);
      this.fail('The 3D model could not be loaded, so we are showing a photograph.');
    }
  }

  private fail(reason: string): void {
    this.engine?.dispose();
    this.engine = null;
    this.engineLoading = null;
    this.fallbackReason.set(reason);
    this.state.set('fallback');
  }

  // ---- controls ----
  zoomIn(): void {
    this.engine?.zoom(0.8);
  }
  zoomOut(): void {
    this.engine?.zoom(1.25);
  }
  reset(): void {
    this.engine?.reset();
    this.autoRotating.set(this.engine?.autoRotating ?? false);
  }
  toggleSpin(): void {
    if (!this.engine) return;
    this.engine.setAutoRotate(!this.engine.autoRotating);
    this.autoRotating.set(this.engine.autoRotating);
  }

  onKey(event: KeyboardEvent): void {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => this.engine?.rotate(-0.2),
      ArrowRight: () => this.engine?.rotate(0.2),
      '+': () => this.zoomIn(),
      '=': () => this.zoomIn(),
      '-': () => this.zoomOut(),
      '0': () => this.reset(),
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }
}

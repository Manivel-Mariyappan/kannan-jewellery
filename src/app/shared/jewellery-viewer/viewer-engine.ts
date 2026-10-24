import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Model3d } from '../../core/models';
import { buildProcedural, createMaterials, JewelleryMaterials } from './procedural-jewellery';

export interface EngineOptions {
  interactive: boolean;
  autoRotate: boolean;
  reducedMotion: boolean;
  onContextLost: () => void;
}

/**
 * Showroom renderer: physically based gold under studio lighting, image-based reflections from
 * a room environment, soft contact shadow, orbit/zoom/pan controls. This module (and Three.js)
 * is code-split and only downloaded when a viewer scrolls into view.
 */
export class ViewerEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  private readonly controls: OrbitControls;
  private readonly stage = new THREE.Group();
  private readonly shadowPlane: THREE.Mesh;
  private readonly materials: JewelleryMaterials = createMaterials();
  private readonly gltf = new GLTFLoader();
  private readonly timer = new THREE.Timer();

  private current: THREE.Object3D | null = null;
  private outgoing: THREE.Object3D | null = null;
  private transition = 1;
  private running = false;
  private frame = 0;
  private homeDistance = 6;
  private loadToken = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly opts: EngineOptions,
  ) {
    const mobile = matchMedia('(max-width: 768px)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile || devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    this.scene.environmentRotation.set(0, Math.PI / 5, 0);
    pmrem.dispose();

    // Warm studio lighting: soft key with shadows, cool fill, bright rim to catch edges.
    const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.radius = 6;
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top = 4;
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
    fill.position.set(-4, 2, 2);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4);
    rim.position.set(-2, 3, -5);
    this.scene.add(key, fill, rim, new THREE.HemisphereLight(0xfff8ee, 0x3b2a1e, 0.35));

    this.shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }));
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.stage, this.shadowPlane);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotate = opts.autoRotate && !opts.reducedMotion;
    this.controls.autoRotateSpeed = 1.1;
    this.controls.enabled = opts.interactive;
    this.controls.enablePan = opts.interactive;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    // Pause auto-rotation while the visitor inspects the piece.
    this.controls.addEventListener('start', () => (this.controls.autoRotate = false));
    if (!opts.interactive) canvas.style.touchAction = 'pan-y';

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.timer.connect(document);
    this.resize();
  }

  private readonly handleContextLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.opts.onContextLost();
  };

  /** Loads and presents a piece, cross-fading (by scale) from the previous one. */
  async show(model: Model3d): Promise<void> {
    const token = ++this.loadToken;
    const object = model.type === 'gltf' ? await this.loadGltf(model.url) : buildProcedural(model.shape, this.materials, model.gem, model.scale ?? 1);
    if (token !== this.loadToken) {
      this.disposeObject(object);
      return;
    }
    this.frameObject(object);

    if (this.outgoing) {
      this.stage.remove(this.outgoing);
      this.disposeObject(this.outgoing);
    }
    this.outgoing = this.current;
    this.current = object;
    this.stage.add(object);
    this.transition = this.opts.reducedMotion ? 1 : 0;
    this.applyTransition();
    this.renderOnce();
  }

  private async loadGltf(url: string): Promise<THREE.Object3D> {
    const gltf = await this.gltf.loadAsync(url);
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    return gltf.scene;
  }

  /** Centres the object, scales it to a consistent size and sits it on the shadow plane. */
  private frameObject(object: THREE.Object3D): void {
    const wrapper = object;
    const box = new THREE.Box3().setFromObject(wrapper);
    const size = box.getSize(new THREE.Vector3());
    const scale = 3 / Math.max(size.x, size.y, size.z, 1e-3);
    wrapper.scale.multiplyScalar(scale);
    box.setFromObject(wrapper);
    const center = box.getCenter(new THREE.Vector3());
    wrapper.position.sub(center);
    wrapper.userData['baseScale'] = wrapper.scale.clone();

    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    this.shadowPlane.position.y = box.min.y - center.y - 0.05;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    this.homeDistance = (radius / Math.sin(fov / 2)) * 1.05;
    this.controls.minDistance = radius * 1.2;
    this.controls.maxDistance = this.homeDistance * 2.2;
    if (!this.current) this.reset();
  }

  reset(): void {
    this.camera.position.set(0, this.homeDistance * 0.18, this.homeDistance);
    this.controls.target.set(0, 0, 0);
    this.controls.autoRotate = this.opts.autoRotate && !this.opts.reducedMotion;
    this.controls.update();
    this.renderOnce();
  }

  zoom(factor: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const len = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset.setLength(len));
    this.controls.update();
    this.renderOnce();
  }

  /** Keyboard rotation: rotates the stage instead of the camera so it works without pointer input. */
  rotate(radians: number): void {
    this.stage.rotation.y += radians;
    this.renderOnce();
  }

  setAutoRotate(on: boolean): void {
    this.controls.autoRotate = on && !this.opts.reducedMotion;
  }

  get autoRotating(): boolean {
    return this.controls.autoRotate;
  }

  resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (time: number) => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(loop);
      this.timer.update(time);
      if (this.transition < 1) {
        this.transition = Math.min(1, this.transition + this.timer.getDelta() / 0.6);
        this.applyTransition();
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private renderOnce(): void {
    if (!this.running) this.renderer.render(this.scene, this.camera);
  }

  private applyTransition(): void {
    const ease = 1 - Math.pow(1 - this.transition, 3);
    if (this.current) {
      const base = this.current.userData['baseScale'] as THREE.Vector3;
      this.current.scale.copy(base).multiplyScalar(0.82 + 0.18 * ease);
      this.current.visible = ease > 0.02;
    }
    if (this.outgoing) {
      const base = this.outgoing.userData['baseScale'] as THREE.Vector3;
      this.outgoing.scale.copy(base).multiplyScalar(Math.max(0.001, 1 - ease));
      if (this.transition >= 1) {
        this.stage.remove(this.outgoing);
        this.disposeObject(this.outgoing);
        this.outgoing = null;
      }
    }
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      // Shared procedural materials are disposed with the engine, not per piece.
      const shared = this.sharedMaterials();
      mats.filter((m) => !shared.has(m)).forEach((m) => m.dispose());
    });
  }

  private sharedMaterials(): Set<THREE.Material> {
    const { gold, antiqueGold, pearl, gems } = this.materials;
    return new Set<THREE.Material>([gold, antiqueGold, pearl, ...Object.values(gems)]);
  }

  dispose(): void {
    this.stop();
    this.loadToken++;
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.timer.dispose();
    this.controls.dispose();
    for (const o of [this.current, this.outgoing]) if (o) this.disposeObject(o);
    this.sharedMaterials().forEach((m) => m.dispose());
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}

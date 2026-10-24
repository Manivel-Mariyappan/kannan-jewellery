import * as THREE from 'three';
import { GemTone, ProceduralShape } from '../../core/models';

/**
 * Demo jewellery built from real 3D geometry (beads, interlocking links, lathed bells, faceted
 * gems). These are stand-ins until scanned or modelled GLB files are available. They are
 * genuine meshes that can be rotated and inspected, not rotating photographs.
 */

export interface JewelleryMaterials {
  gold: THREE.MeshPhysicalMaterial;
  antiqueGold: THREE.MeshPhysicalMaterial;
  pearl: THREE.MeshPhysicalMaterial;
  gems: Record<GemTone, THREE.MeshPhysicalMaterial>;
}

export function createMaterials(): JewelleryMaterials {
  // Linear-space reflectance of polished yellow gold, warmed slightly for 22K.
  const gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setRGB(1.0, 0.64, 0.24),
    metalness: 1,
    roughness: 0.16,
    clearcoat: 0.35,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.25,
  });
  const antiqueGold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setRGB(0.78, 0.5, 0.2),
    metalness: 1,
    roughness: 0.42,
    envMapIntensity: 1.0,
  });
  const pearl = new THREE.MeshPhysicalMaterial({
    color: 0xf4eee2,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xffe9d6),
    iridescence: 0.35,
  });
  const gem = (color: number) =>
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0.04,
      ior: 1.77,
      specularIntensity: 1,
      clearcoat: 1,
      flatShading: true,
      envMapIntensity: 2.2,
    });
  return { gold, antiqueGold, pearl, gems: { ruby: gem(0x9b0f24), emerald: gem(0x0c7a46), pearl } };
}

// ---------- geometry helpers ----------

/** A round brilliant-style cut: lathed profile with few segments so the facets show. */
function gemGeometry(radius: number): THREE.BufferGeometry {
  const r = radius;
  const profile = [
    new THREE.Vector2(0, -0.9 * r),
    new THREE.Vector2(r, -0.05 * r),
    new THREE.Vector2(r, 0.05 * r),
    new THREE.Vector2(0.62 * r, 0.38 * r),
    new THREE.Vector2(0, 0.38 * r),
  ];
  const g = new THREE.LatheGeometry(profile, 12);
  g.rotateX(Math.PI / 2); // table faces +Z (towards the viewer)
  return g;
}

/** Hanging strand: lower arc of an ellipse in the XY plane, with gentle depth. */
function strandCurve(rx: number, ry: number, top = 0, depth = 0.25): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = Math.PI * (0.06 + 0.88 * (i / 40));
    const x = -rx * Math.cos(t);
    const y = top - ry * Math.sin(t);
    const z = -depth * Math.sin(t) * 0.5 + depth * 0.5 * Math.cos(t) ** 2;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** Instanced spheres spaced evenly along a curve. */
function beadStrand(curve: THREE.Curve<THREE.Vector3>, radius: number, gap: number, mat: THREE.Material): THREE.InstancedMesh {
  const count = Math.max(2, Math.floor(curve.getLength() / (radius * 2 + gap)));
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 24, 16), mat, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m.makeTranslation(curve.getPointAt(i / (count - 1)));
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  return mesh;
}

/** Interlocking oval links following a curve, alternating 90° like a real cable chain. */
function linkChain(curve: THREE.Curve<THREE.Vector3>, linkLength: number, wire: number, mat: THREE.Material): THREE.InstancedMesh {
  const geo = new THREE.TorusGeometry(linkLength / 2, wire, 10, 28);
  geo.scale(1, 0.62, 1);
  const pitch = linkLength * 0.78;
  const count = Math.floor(curve.getLength() / pitch);
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const xAxis = new THREE.Vector3(1, 0, 0);
  const q = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const pos = curve.getPointAt(t);
    q.setFromUnitVectors(xAxis, curve.getTangentAt(t).normalize());
    twist.setFromAxisAngle(xAxis, i % 2 ? Math.PI / 2 : 0);
    m.compose(pos, q.clone().multiply(twist), new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
  }
  mesh.castShadow = true;
  return mesh;
}

/** Eight-petal gold flower with a faceted centre stone, facing +Z. */
function flower(radius: number, gold: THREE.Material, gem: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const petal = new THREE.SphereGeometry(1, 24, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const m = new THREE.Mesh(petal, gold);
    m.scale.set(radius * 0.42, radius * 0.24, radius * 0.14);
    m.position.set(Math.cos(a) * radius * 0.62, Math.sin(a) * radius * 0.62, 0);
    m.rotation.z = a;
    m.castShadow = true;
    g.add(m);
  }
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.42, radius * 0.46, radius * 0.2, 40), gold);
  bezel.rotation.x = Math.PI / 2;
  g.add(bezel);
  const stone = new THREE.Mesh(gemGeometry(radius * 0.36), gem);
  stone.position.z = radius * 0.12;
  g.add(stone);
  return g;
}

/** Teardrop pendant: gold frame, inset stone and a pearl drop. */
function teardrop(size: number, gold: THREE.Material, gem: THREE.Material, pearl: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const outline = (s: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.7 * s, -0.55 * s, 0.9 * s, -1.4 * s, 0, -2 * s);
    shape.bezierCurveTo(-0.9 * s, -1.4 * s, -0.7 * s, -0.55 * s, 0, 0);
    return shape;
  };
  const frame = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outline(size), { depth: size * 0.18, bevelEnabled: true, bevelSize: size * 0.06, bevelThickness: size * 0.06, bevelSegments: 4, curveSegments: 32 }),
    gold,
  );
  frame.position.z = -size * 0.09;
  frame.castShadow = true;
  g.add(frame);
  const inset = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outline(size * 0.62), { depth: size * 0.12, bevelEnabled: true, bevelSize: size * 0.04, bevelThickness: size * 0.05, bevelSegments: 2, curveSegments: 24 }),
    gem,
  );
  inset.position.set(0, -size * 0.38, size * 0.08);
  g.add(inset);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(size * 0.2, 24, 16), pearl);
  drop.position.y = -2.15 * size;
  g.add(drop);
  return g;
}

// ---------- pieces ----------

function ring(m: JewelleryMaterials, gem: GemTone): THREE.Group {
  const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 48, 160), m.gold);
  band.scale.z = 1.9;
  band.castShadow = true;
  g.add(band);
  const crown = flower(0.62, m.gold, m.gems[gem]);
  crown.rotation.x = -Math.PI / 2;
  crown.position.y = 1.16;
  g.add(crown);
  g.rotation.set(0.35, 0.5, 0);
  return g;
}

function bangle(m: JewelleryMaterials, gem?: GemTone): THREE.Group {
  const g = new THREE.Group();
  const R = 1.6;
  const body = new THREE.Mesh(new THREE.TorusGeometry(R, 0.15, 48, 220), m.gold);
  body.scale.z = 2.4;
  body.castShadow = true;
  g.add(body);
  for (const z of [-0.33, 0.33]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.06, 0.045, 16, 220), m.gold);
    rim.position.z = z;
    g.add(rim);
  }
  // Studded band of stones (or polished gold domes) around the outer face.
  const count = 28;
  const studGeo = gem ? gemGeometry(0.11) : new THREE.SphereGeometry(0.08, 20, 14);
  const studs = new THREE.InstancedMesh(studGeo, gem ? m.gems[gem] : m.gold, count);
  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    mat.compose(dir.clone().multiplyScalar(R + 0.15), q, new THREE.Vector3(1, 1, 1));
    studs.setMatrixAt(i, mat);
  }
  g.add(studs);
  g.rotation.set(1.05, 0, 0.25);
  return g;
}

function chain(m: JewelleryMaterials, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(linkChain(strandCurve(1.5, 2.2, 1.1, 0.4), 0.28 * scale, 0.045 * scale, m.gold));
  if (scale < 1) {
    // Small diamond-shaped pendant for the fine daily chain.
    const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), m.gold);
    pendant.scale.z = 0.4;
    pendant.position.set(0, -1.38, 0.2);
    g.add(pendant);
  }
  return g;
}

function necklace(m: JewelleryMaterials, gem: GemTone): THREE.Group {
  const g = new THREE.Group();
  const curve = strandCurve(1.5, 2.1, 1.1, 0.4);
  g.add(beadStrand(curve, 0.075, 0.02, m.gold));
  const p = teardrop(0.36, m.gold, m.gems[gem], m.pearl);
  p.position.copy(curve.getPointAt(0.5)).add(new THREE.Vector3(0, -0.08, 0.08));
  g.add(p);
  return g;
}

function bridal(m: JewelleryMaterials, gem: GemTone): THREE.Group {
  const g = new THREE.Group();
  const layers = [
    { rx: 1.25, ry: 1.4, r: 0.065, mat: m.gold },
    { rx: 1.45, ry: 1.95, r: 0.075, mat: m.gold },
    { rx: 1.65, ry: 2.5, r: 0.085, mat: m.pearl },
  ];
  layers.forEach(({ rx, ry, r, mat }, i) => {
    const curve = strandCurve(rx, ry, 1.1, 0.35 + i * 0.1);
    g.add(beadStrand(curve, r, 0.015, mat));
  });
  const low = strandCurve(1.65, 2.5, 1.1, 0.55).getPointAt(0.5);
  const medallion = flower(0.42, m.gold, m.gems.emerald);
  medallion.position.copy(low).add(new THREE.Vector3(0, -0.1, 0.12));
  g.add(medallion);
  const p = teardrop(0.34, m.gold, m.gems[gem], m.pearl);
  p.position.copy(low).add(new THREE.Vector3(0, -0.5, 0.1));
  g.add(p);
  return g;
}

function antique(m: JewelleryMaterials, gem: GemTone): THREE.Group {
  const g = new THREE.Group();
  const curve = strandCurve(1.45, 1.9, 1.1, 0.35);
  g.add(beadStrand(curve, 0.09, 0.02, m.antiqueGold));
  const centre = curve.getPointAt(0.5).add(new THREE.Vector3(0, -0.72, 0.12));
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 64), m.antiqueGold);
  disc.rotation.x = Math.PI / 2;
  disc.position.copy(centre);
  disc.castShadow = true;
  g.add(disc);
  const halo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.065, 16, 12), m.antiqueGold, 26);
  const mat = new THREE.Matrix4();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    mat.makeTranslation(centre.x + Math.cos(a) * 0.7, centre.y + Math.sin(a) * 0.7, centre.z);
    halo.setMatrixAt(i, mat);
  }
  g.add(halo);
  const motif = flower(0.42, m.antiqueGold, m.gems[gem]);
  motif.position.copy(centre).add(new THREE.Vector3(0, 0, 0.08));
  g.add(motif);
  const fringe = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 16, 12), m.pearl, 9);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.2 + (0.6 * i) / 8);
    mat.makeTranslation(centre.x + Math.cos(a) * 0.86, centre.y + Math.sin(a) * 0.86, centre.z);
    fringe.setMatrixAt(i, mat);
  }
  g.add(fringe);
  return g;
}

function jhumka(m: JewelleryMaterials, gem: GemTone): THREE.Group {
  const g = new THREE.Group();
  const stud = flower(0.34, m.gold, m.gems[gem]);
  stud.position.y = 0.55;
  g.add(stud);
  const link = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 10, 24), m.gold);
  link.position.y = 0.17;
  g.add(link);
  // Bell: a lathed dome flaring out to the rim.
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    profile.push(new THREE.Vector2(0.06 + 0.46 * Math.pow(t, 1.6), 0.1 - t * 0.85));
  }
  const bellMat = m.gold.clone();
  bellMat.side = THREE.DoubleSide;
  const bell = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), bellMat);
  bell.castShadow = true;
  g.add(bell);
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 12, 64), m.gold);
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = -0.75;
  g.add(rimRing);
  const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 16, 12), m.pearl, 22);
  const mat = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    mat.makeTranslation(Math.cos(a) * 0.52, -0.84, Math.sin(a) * 0.52);
    pearls.setMatrixAt(i, mat);
  }
  g.add(pearls);
  return g;
}

function earrings(m: JewelleryMaterials, gem: GemTone): THREE.Group {
  const g = new THREE.Group();
  const left = jhumka(m, gem);
  left.position.x = -0.75;
  left.rotation.y = 0.3;
  const right = jhumka(m, gem);
  right.position.x = 0.75;
  right.rotation.y = -0.3;
  g.add(left, right);
  return g;
}

export function buildProcedural(shape: ProceduralShape, materials: JewelleryMaterials, gemTone?: GemTone, scale = 1): THREE.Group {
  const gem = gemTone ?? 'ruby';
  switch (shape) {
    case 'ring':
      return ring(materials, gem);
    case 'bangle':
      // Without a stone the kada gets polished gold studs.
      return bangle(materials, gemTone === 'pearl' ? undefined : gemTone);
    case 'chain':
      return chain(materials, scale);
    case 'necklace':
      return necklace(materials, gem);
    case 'bridal':
      return bridal(materials, gem);
    case 'antique':
      return antique(materials, gem);
    case 'earring':
      return earrings(materials, gem);
  }
}

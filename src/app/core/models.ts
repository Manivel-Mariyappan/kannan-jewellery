export type Purity = '24K' | '22K' | '18K' | '14K';

export type GemTone = 'ruby' | 'emerald' | 'pearl';

export type ProceduralShape = 'ring' | 'bangle' | 'chain' | 'necklace' | 'earring' | 'bridal' | 'antique';

/**
 * A 3D presentation for a piece of jewellery.
 * - `gltf`: a real GLB/GLTF model file (place it under `public/models/`).
 * - `procedural`: demo geometry generated in Three.js — genuine 3D, but a stand-in for a scanned model.
 */
export type Model3d =
  | { type: 'gltf'; url: string }
  | { type: 'procedural'; shape: ProceduralShape; gem?: GemTone; scale?: number };

export interface Product {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  categories: string[];
  weightGrams: number | null;
  purity: Purity | null;
  /** Paths relative to the site root (e.g. `images/kj-nk-101-1.webp`) or full URLs. */
  images: string[];
  model3d: Model3d | null;
  isNew: boolean;
  isFeatured: boolean;
  published: boolean;
  /** Sample content shipped with the template. Shown with a "Demo" label on the site. */
  demo: boolean;
  createdAt: string;
}

/** Per-gram rates in INR. `null` means the store has not published a rate. */
export interface GoldRateData {
  rate22k: number | null;
  rate24k: number | null;
  updatedAt: string | null;
}

export type GoldRateStatus = 'current' | 'delayed' | 'unavailable';

export interface Testimonial {
  name: string;
  quote: string;
  place?: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  /** International format, digits only, e.g. 919876543210. */
  whatsappNumber: string;
  email: string;
  openingHours: { days: string; hours: string }[];
  mapsQuery: string;
  directions: string;
  /** Verified certification statement, e.g. hallmarking registration. Leave empty if not verified. */
  certification: string;
  /** Only add genuine customer testimonials, shared with permission. */
  testimonials?: Testimonial[];
}

export interface Category {
  slug: string;
  name: string;
  blurb: string;
  image: string;
  /** Virtual categories are computed from product flags instead of `categories`. */
  virtual?: 'new';
}

export type Purity = '24K' | '22K' | '18K' | '14K';

export type GemTone = 'ruby' | 'emerald' | 'pearl';

export type ProceduralShape =
  'ring' | 'bangle' | 'chain' | 'necklace' | 'earring' | 'bridal' | 'antique';

// gltf: a model file in public/models/
// procedural: demo shape built in code until real models are available
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
  // net weight, shown on the website
  weightGrams: number | null;
  purity: Purity | null;
  // Admin-only fields. Optional so older products.json files still load.
  grossWeightGrams?: number | null;
  stoneWeightGrams?: number | null;
  makingChargePercent?: number | null;
  wastagePercent?: number | null;
  // BIS hallmark ID, 6 characters
  huid?: string;
  stockStatus?: 'In stock' | 'Made to order' | 'Out of stock';
  quantity?: number | null;
  // e.g. images/kj-nk-101-1.webp, or a full URL
  images: string[];
  model3d: Model3d | null;
  isNew: boolean;
  isFeatured: boolean;
  published: boolean;
  // sample product, shown with a "Demo" label
  demo: boolean;
  createdAt: string;
}

// Per-gram rates in INR. null = not published yet.
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
  // digits only, with country code, e.g. 919876543210
  whatsappNumber: string;
  email: string;
  openingHours: { days: string; hours: string }[];
  mapsQuery: string;
  directions: string;
  // e.g. hallmarking registration; leave empty unless verified
  certification: string;
  // real customer quotes only, with their permission
  testimonials?: Testimonial[];
}

export interface Category {
  slug: string;
  name: string;
  blurb: string;
  image: string;
  // 'new' = built from the isNew flag instead of the categories list
  virtual?: 'new';
}

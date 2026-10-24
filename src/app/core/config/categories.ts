import { Category } from '../models';

export const CATEGORIES: Category[] = [
  { slug: 'necklaces', name: 'Gold Necklaces', blurb: 'Bead strands, pendants and statement pieces', image: 'demo/shots/lakshmi-ruby-bead-necklace-1.webp' },
  { slug: 'chains', name: 'Gold Chains', blurb: 'Link chains in every weight', image: 'demo/shots/classic-link-chain-1.webp' },
  { slug: 'bangles', name: 'Bangles', blurb: 'Kadas, sets and slim daily bangles', image: 'demo/shots/ruby-studded-kada-1.webp' },
  { slug: 'rings', name: 'Rings', blurb: 'Flower settings, bands and crowns', image: 'demo/shots/mallika-flower-ring-1.webp' },
  { slug: 'earrings', name: 'Earrings', blurb: 'Jhumkas, studs and drops', image: 'demo/shots/pearl-fringe-jhumkas-1.webp' },
  { slug: 'bridal', name: 'Bridal Jewellery', blurb: 'Harams, layered sets and wedding pieces', image: 'demo/shots/maharani-bridal-haram-1.webp' },
  { slug: 'antique', name: 'Antique Jewellery', blurb: 'Temple work in an antique finish', image: 'demo/shots/temple-pendant-necklace-1.webp' },
  { slug: 'traditional', name: 'Traditional Jewellery', blurb: 'Classic South Indian designs', image: 'demo/shots/antique-emerald-medallion-1.webp' },
  { slug: 'daily-wear', name: 'Daily Wear', blurb: 'Light pieces for every day', image: 'demo/shots/petite-pendant-chain-1.webp' },
  { slug: 'latest', name: 'Latest Arrivals', blurb: 'New in the showroom', image: 'demo/shots/emerald-drop-necklace-1.webp', virtual: 'new' },
];

export const categoryBySlug = (slug: string | null | undefined): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug);

export const categoryName = (slug: string): string => categoryBySlug(slug)?.name ?? slug;

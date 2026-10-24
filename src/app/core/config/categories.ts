import { Category } from '../models';

export const CATEGORIES: Category[] = [
  { slug: 'necklaces', name: 'Gold Necklaces', blurb: 'Bead strands, pendants and statement pieces', image: 'demo/necklace-1.svg' },
  { slug: 'chains', name: 'Gold Chains', blurb: 'Link chains in every weight', image: 'demo/chain-1.svg' },
  { slug: 'bangles', name: 'Bangles', blurb: 'Kadas, sets and slim daily bangles', image: 'demo/bangle-1.svg' },
  { slug: 'rings', name: 'Rings', blurb: 'Flower settings, bands and crowns', image: 'demo/ring-1.svg' },
  { slug: 'earrings', name: 'Earrings', blurb: 'Jhumkas, studs and drops', image: 'demo/earring-1.svg' },
  { slug: 'bridal', name: 'Bridal Jewellery', blurb: 'Harams, layered sets and wedding pieces', image: 'demo/bridal-1.svg' },
  { slug: 'antique', name: 'Antique Jewellery', blurb: 'Temple work in an antique finish', image: 'demo/antique-1.svg' },
  { slug: 'traditional', name: 'Traditional Jewellery', blurb: 'Classic South Indian designs', image: 'demo/antique-2.svg' },
  { slug: 'daily-wear', name: 'Daily Wear', blurb: 'Light pieces for every day', image: 'demo/daily-1.svg' },
  { slug: 'latest', name: 'Latest Arrivals', blurb: 'New in the showroom', image: 'demo/necklace-2.svg', virtual: 'new' },
];

export const categoryBySlug = (slug: string | null | undefined): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug);

export const categoryName = (slug: string): string => categoryBySlug(slug)?.name ?? slug;

import { GoldRateData, GoldRateStatus } from '../models';

// 1 sovereign (pavan) = 8 grams
export const SOVEREIGN_GRAMS = 8;

// Rounded to the paisa to avoid floating point noise like 57202.80000000001.
export function eightGramRate(perGram: number): number {
  return Math.round(perGram * SOVEREIGN_GRAMS * 100) / 100;
}

export function isValidRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// A rate with no timestamp is treated as delayed.
export function goldRateStatus(
  data: GoldRateData | null,
  now: Date,
  staleHours: number,
): GoldRateStatus {
  if (!data || !isValidRate(data.rate22k) || !isValidRate(data.rate24k)) return 'unavailable';
  const updated = data.updatedAt ? Date.parse(data.updatedAt) : NaN;
  if (Number.isNaN(updated)) return 'delayed';
  return now.getTime() - updated > staleHours * 3_600_000 ? 'delayed' : 'current';
}

const inrWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ₹7,150 / ₹7,150.50, with Indian grouping (₹1,23,456)
export const formatInr = (value: number): string =>
  (Number.isInteger(value) ? inrWhole : inrPaise).format(value);

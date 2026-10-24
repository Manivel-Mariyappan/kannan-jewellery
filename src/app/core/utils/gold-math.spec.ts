import { eightGramRate, formatInr, goldRateStatus } from './gold-math';

describe('gold math', () => {
  it('multiplies the per-gram rate by 8', () => {
    expect(eightGramRate(7150)).toBe(57200);
    expect(eightGramRate(7150.35)).toBe(57202.8);
  });

  it('formats rupees with Indian grouping', () => {
    expect(formatInr(57200)).toBe('₹57,200');
    expect(formatInr(123456)).toBe('₹1,23,456');
    expect(formatInr(7150.5)).toBe('₹7,150.50');
  });

  describe('status', () => {
    const now = new Date('2026-10-23T12:00:00Z');

    it('is unavailable without a published rate', () => {
      expect(goldRateStatus({ rate22k: null, rate24k: null, updatedAt: null }, now, 24)).toBe('unavailable');
      expect(goldRateStatus({ rate22k: 0, rate24k: 7000, updatedAt: '2026-10-23T09:00:00Z' }, now, 24)).toBe('unavailable');
    });

    it('is current when recently updated', () => {
      expect(goldRateStatus({ rate22k: 7000, rate24k: 7600, updatedAt: '2026-10-23T09:00:00Z' }, now, 24)).toBe('current');
    });

    it('is delayed when stale or missing a timestamp', () => {
      expect(goldRateStatus({ rate22k: 7000, rate24k: 7600, updatedAt: '2026-10-21T09:00:00Z' }, now, 24)).toBe('delayed');
      expect(goldRateStatus({ rate22k: 7000, rate24k: 7600, updatedAt: null }, now, 24)).toBe('delayed');
    });
  });
});

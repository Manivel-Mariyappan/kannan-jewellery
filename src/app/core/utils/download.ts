/** Saves `data` as a pretty-printed JSON file in the visitor's browser. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** URL-friendly slug: "Ruby Kada 22K" → "ruby-kada-22k". */
export const slugify = (value: string): string =>
  value.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');

/** Resolves a data-file asset path for <img src>. Absolute URLs and data URLs are kept as they are. */
export const assetUrl = (path: string): string =>
  /^(https?:|data:|blob:|\/)/.test(path) ? path : `/${path}`;

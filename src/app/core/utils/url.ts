// "Ruby Kada 22K" becomes "ruby-kada-22k"
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD') // so accents can be stripped below
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

// Paths in the JSON files are relative ("demo/shots/ring-1.webp"); make them root-relative.
export function assetUrl(path: string): string {
  const isAlreadyUsable = /^(https?:|data:|blob:|\/)/.test(path);
  return isAlreadyUsable ? path : `/${path}`;
}

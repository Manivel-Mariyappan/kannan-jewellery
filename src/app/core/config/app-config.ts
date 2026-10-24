/**
 * Site-wide configuration. Shop details (address, phone, WhatsApp number, hours) live in
 * `public/data/settings.json` and are editable in the admin portal — not here.
 */
export const APP_CONFIG = {
  /** Public origin used for canonical URLs, e.g. 'https://www.kannanjewellery.in'. Empty = current origin. */
  siteUrl: '',

  dataUrls: {
    products: 'data/products.json',
    goldRate: 'data/gold-rate.json',
    settings: 'data/settings.json',
  },

  /**
   * Optional live gold-rate endpoint. It must return JSON shaped like
   * `{ "rate22k": 7000, "rate24k": 7600, "updatedAt": "2026-10-23T09:30:00+05:30" }` (INR per gram).
   * Never put a paid API key here: everything in this file ships to the browser. Point it at
   * a small proxy (e.g. a serverless function) that holds the key. When empty or failing, the
   * site uses `data/gold-rate.json`.
   */
  goldRateApiUrl: '',

  /** A published rate older than this is labelled "delayed" on the website. */
  goldRateStaleHours: 24,

  /**
   * SHA-256 hash of the admin portal passcode. Default passcode: `kannan@admin`.
   * Generate a new hash with: node -e "console.log(require('crypto').createHash('sha256').update('NEW-PASSCODE').digest('hex'))"
   *
   * IMPORTANT: this is a convenience lock only. The site has no backend, so the admin portal
   * cannot publish changes by itself — it produces JSON files that someone with access to the
   * hosting deploys. See README → "Admin portal".
   */
  adminPasscodeSha256: '441a171d4f8b5f0a626bd34feb4d254f6cd3510b073805742c625b4c0ff38417',
} as const;

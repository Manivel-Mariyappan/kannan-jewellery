// Shop details (address, phone, WhatsApp, hours) are in public/data/settings.json, not here.
export const APP_CONFIG = {
  // e.g. 'https://www.kannanjewellery.in'. Leave empty to use the current domain.
  siteUrl: '',

  dataUrls: {
    products: 'data/products.json',
    goldRate: 'data/gold-rate.json',
    settings: 'data/settings.json',
  },

  // Optional live rate endpoint returning { rate22k, rate24k, updatedAt } in INR per gram.
  // Don't put an API key here (this file is public); use a small proxy that holds the key.
  // When empty or failing, data/gold-rate.json is used.
  goldRateApiUrl: '',

  // Older rates are shown as "Delayed".
  goldRateStaleHours: 24,

  // SHA-256 of the admin password (default: kannan@admin). To change it:
  // node -e "console.log(require('crypto').createHash('sha256').update('NEW-PASSWORD').digest('hex'))"
  adminPasscodeSha256: '441a171d4f8b5f0a626bd34feb4d254f6cd3510b073805742c625b4c0ff38417',
} as const;

# Kannan Jewellery — Website

A premium, multi-page showroom website for Kannan Jewellery. It showcases gold jewellery with an interactive 3D viewer, shows today's gold rate, and turns interest into **WhatsApp enquiries**. There is no cart, checkout or payment, by design.

- **Angular 21** (standalone components, signals, zoneless), TypeScript
- **Three.js** 3D viewer, lazy-loaded only when a viewer scrolls into view
- **AOS** scroll animations, disabled for visitors who prefer reduced motion
- **No backend.** All content lives in JSON files in `public/data/`

## Quick start

```bash
npm install
npm start            # http://localhost:4200
npm test             # unit tests (gold-rate maths, WhatsApp links, app shell)
npm run build        # production build → dist/KANNAN_JEWELLERY/browser
```

## Pages

| Route | Page |
|---|---|
| `/` | Home: hero with 3D piece, today's gold rate, editorial collections, 3D showroom, bridal, new arrivals, why us, visit |
| `/collections`, `/collections/:category` | Category navigation, search, purity filter, sort |
| `/jewellery/:slug` | Product detail: 3D viewer, photos, code, purity, weight, WhatsApp enquiry, related pieces |
| `/bridal` | Bridal collection: traditional & contemporary, 3D showroom, consultation booking |
| `/about`, `/contact` | Story, values, pricing transparency · address, phone, WhatsApp, hours, Google Map, directions |
| `/admin` | Admin portal in `src/admin/` (see below) |

## Before going live: checklist

1. **WhatsApp number & phone.** Admin → Shop settings (or edit `public/data/settings.json`). Until a WhatsApp number is set, enquiry buttons link to the Contact page and the floating button is hidden.
2. **Full address.** `settings.json` currently has `102, Salem Main Road, Tamil Nadu`. Add the town and PIN code, and check the Google Maps search text.
3. **Gold rate.** `public/data/gold-rate.json` ships with `null` values, so the site shows "Rate unavailable". No prices are invented.
4. **Admin passcode.** Change the default (`kannan@admin`) in `src/app/core/config/app-config.ts` (checked by `src/admin/core/admin-auth.service.ts`). The command to generate a new hash is in that file.
5. **Replace demo products.** All 16 sample products are flagged `"demo": true`, labelled "Demo" on the site, and use product shots rendered from the demo 3D models (`public/demo/shots/`). Admin → Products → *Remove demo products*.
6. **Site URL.** Set `siteUrl` in `app-config.ts` (e.g. `https://www.kannanjewellery.in`) so canonical URLs and social previews are correct.

## Content files (`public/data/`)

| File | Contents |
|---|---|
| `products.json` | Every product: name, code, slug, categories, purity, weight, images, 3D model, flags (new / featured / published / demo) |
| `gold-rate.json` | `{ "rate22k": 7150, "rate24k": 7800, "updatedAt": "2026-10-23T09:30:00+05:30" }`: rupees **per gram** |
| `settings.json` | Shop name, address, phone, WhatsApp, email, hours, map search, directions, certification, optional `testimonials` |

Images go in `public/images/` and 3D models in `public/models/`. Reference them as `images/foo.webp` and `models/foo.glb`.

## Admin portal (`/admin`)

The admin portal lives in its own folder, `src/admin/`, and is lazy-loaded: website visitors never download its code. It uses **Bootstrap 5** form controls, **ng-select** (Chosen-style searchable dropdowns), **AG Grid Community** for the product table, **ng-bootstrap** for the date picker and the add/edit offcanvas, and **SweetAlert2** (ngx-sweetalert2) for confirmations. Bootstrap is loaded only on /admin (as the separate `admin.css` bundle), so it never affects the website.


- **Products:** AG Grid with search, sorting, filters and paging; tick Published / New / Featured directly in the grid; add or edit in a side panel (offcanvas) built from reusable section cards (`src/admin/shared/admin-card.ts`); delete with confirmation; upload multiple photos (compressed to WebP in the browser) or add them by path; choose a GLB model or a demo 3D shape; publish / unpublish; mark as New or Featured.
- **Gold rate:** enter 22K and 24K per-gram rates (number-only inputs) with an effective date (dd-mm-yyyy) and time. The 8-gram values are calculated automatically.
- **Shop settings:** address, phone, WhatsApp, email, opening hours, directions, certification.
- **Publish:** download the updated JSON files.

**How publishing works.** Edits are saved as *drafts* in that browser, and the owner sees them on the real pages, marked with a yellow "previewing" bar. To make them live for everyone:

1. Admin → Publish → download the changed file(s).
2. Replace them in `public/data/`, copying any image or model files into `public/images/` or `public/models/`.
3. Rebuild and deploy (or `git push` if your host deploys from Git).
4. Discard the drafts in Admin → Publish.

> **Security note.** Without a server, the admin passcode is only a convenience lock. Anyone can read the site's JavaScript, so it is not real authentication. That is acceptable here because the admin portal **cannot change the live site**: only someone with access to the hosting or repository can publish. See *Moving to a backend* if staff need to publish directly.

## Gold rate

- The 8-gram rate is `8 × per-gram rate` for the same purity (`src/app/core/utils/gold-math.ts`, unit-tested).
- **Status labels:** *Today's rate* when updated within 24 hours; *Delayed — please confirm with us* when older (change `goldRateStaleHours`); *Rate unavailable* when no rate is published.
- A disclaimer explains that prices are indicative and that making charges, wastage, GST and other charges apply.
- **Optional live rates.** Set `goldRateApiUrl` in `app-config.ts` to an endpoint that returns `{ rate22k, rate24k, updatedAt }`. If it fails, the site falls back to `gold-rate.json`, and that file's timestamp decides the label. **Never put a paid API key (e.g. goldapi.io) in the Angular app**, because it ships to every visitor. Use a small serverless proxy that holds the key.

## 3D viewer

`src/app/shared/jewellery-viewer/` contains three parts:
- `viewer-engine.ts`: physically based gold, studio lighting, environment reflections, soft shadows, orbit / zoom / pan, transitions between pieces, pauses when off-screen.
- `procedural-jewellery.ts`: **demo** pieces built from real 3D geometry (bead strands, interlocking chain links, lathed jhumka bells, faceted stones). They are genuine rotatable models, but they are stand-ins, labelled "Demo 3D model".
- **Real models:** put licensed `.glb` files in `public/models/` and select *GLB / GLTF model file* in the admin. Keep them under ~5 MB (Draco or Meshopt compression).
- **Fallback:** without WebGL, on Save-Data or low-memory devices, or if a model fails to load, the viewer shows the photograph with a short explanation.
- **Keyboard:** arrow keys rotate, `+` and `−` zoom, `0` resets the view.

## Deployment

The output in `dist/KANNAN_JEWELLERY/browser` is a static site, so it can go on Netlify, Vercel, Cloudflare Pages, Firebase Hosting, or any web server. Configure **SPA fallback** (all routes → `index.html`). For example:
- Netlify: `public/_redirects` containing `/*  /index.html  200`
- Nginx: `try_files $uri $uri/ /index.html;`

Make sure `/data/*.json` is not cached for long, so a new gold rate shows up quickly. The site also adds a cache-busting query string when it loads these files.

## Moving to a backend (recommended once products change daily)

To let staff publish directly from the admin portal, with secure logins:
1. Add an API (e.g. Node/Express, Firebase, or Supabase) with endpoints for products, gold rate and settings, plus **server-side** authentication and authorisation on every write.
2. Store photos and models in object storage (S3, Cloudflare R2, Firebase Storage).
3. Point `ContentStore` (`src/app/core/services/content-store.ts`) at the API instead of `/data/*.json`, and replace `saveDraft()` with API calls. The pages and components don't need to change.
4. Fetch live gold rates on the server and store each verified rate with its timestamp.

## Project structure

```
src/admin/      admin portal: core (auth, alerts, numbers-only input), layout (fixed sidebar), shared (admin-card), pages
src/app/
  core/        config, models, services (content store, products, gold rate, WhatsApp, SEO, motion), utils
  shared/      header, footer, WhatsApp button & floating button, product tile, showroom, 3D viewer, icons, reveal directive
  features/    home, collections, product-detail, bridal, about, contact, gold-rate, not-found
public/
  data/        products.json, gold-rate.json, settings.json
  demo/shots/  demo product shots rendered from the 3D models (replace with real photos)
```

## Things that need external services or assets

- **Real jewellery photographs and licensed 3D models.** The demo renders and procedural models are placeholders.
- **Live market gold rates.** These need a rate provider and a server-side proxy. Until then, the owner enters rates manually.
- **Google Maps** uses the keyless embed. For a custom-styled map, use the Maps Embed API with an API key.
- **Fonts** (Plus Jakarta Sans, Inter) load from Google Fonts.

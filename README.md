# VISO

Small catalog site for the VISO home bakery: **Home**, **Catalog**, and **Contact**.

## Stack

- HTML pages + [Vite](https://vitejs.dev/) for dev and bundling  
- [Tailwind CSS](https://tailwindcss.com/) (theme: `#ff4610` brand, `#d4eaea` surface)  
- TypeScript in `src/main.ts` (scroll reveals, nav state, card tilt, magnetic buttons, contact form acknowledgment)

## Commands

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Use the nav between `index.html`, `catalog.html`, and `contact.html`.

```bash
npm run build
```

Output is in `dist/` — deploy **that** folder, not the raw repo. Tailwind is compiled into the CSS bundle by this step; there is no separate Tailwind CLI requirement for production.

### GitHub Pages

If Pages is set to “Deploy from a branch” using the **repository root**, the browser loads `index.html` but **not** the Vite build: `/src/main.ts` is not bundled and styles never load. Do this instead:

1. **Repository → Settings → Pages → Build and deployment:** set **Source** to **GitHub Actions** (not “Deploy from branch” with only source files).
2. Push this repo; the workflow `.github/workflows/deploy-pages.yml` runs `npm ci`, `npm run build` (with the correct `VITE_BASE` for project sites like `/VISO/`, or `/` for a `username.github.io` repo), and uploads `dist/`.
3. Open **`https://<user>.github.io/<repo>/`** for a project site (e.g. `/VISO/`), not only the bare `github.io` hostname unless you use the special `username.github.io` repository.

## Before launch

- Set `link rel="canonical"` and `og:*` URLs in each HTML file to your real domain (currently `https://example.com/...`).  
- Update footer social links (Instagram, Facebook, WhatsApp) and `mailto:` on the contact page.  
- Wire the contact form to your backend or form service if you need real submissions (the UI shows a thank-you message only).

## Optional logo

Add your logo under `assets/logo/` and reference it from the header if you want an image next to the wordmark.

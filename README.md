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

After `npm run build`, the **compiled** site (HTML + CSS + JS) is written to the **`docs/`** folder. Tailwind is bundled into the CSS file there. The repo root HTML is only for development — **GitHub Pages must serve `docs/`, not the root.**

### GitHub Pages (choose one)

**A — Deploy from branch (simplest, no Actions required)**  
1. Run `npm run build` before each release (or we commit `docs/` so it stays in sync).  
2. **Settings → Pages → Build and deployment → Source:** **Deploy from a branch**.  
3. Branch: **`main`**, folder: **`/docs`** (not “/ (root)”).  
4. Save. After a minute, open `https://<user>.github.io/<repo>/` (e.g. `…/VISO/`).

**B — GitHub Actions**  
1. **Settings → Pages → Source:** **GitHub Actions**.  
2. Pushes to `main` run `.github/workflows/deploy-pages.yml`, which builds and publishes the `docs/` output.

If you use **root** (`/`) as the Pages folder, the live site will keep showing unstyled HTML and `/src/main.ts` — that is the wrong folder.

## Before launch

- Set `link rel="canonical"` and `og:*` URLs in each HTML file to your real domain (currently `https://example.com/...`).  
- Update footer social links (Instagram, Facebook, WhatsApp) and `mailto:` on the contact page.  
- Wire the contact form to your backend or form service if you need real submissions (the UI shows a thank-you message only).

## Optional logo

Add your logo under `assets/logo/` and reference it from the header if you want an image next to the wordmark.

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

Open the URL Vite prints (usually `http://localhost:5173`). Use the nav or `/`, `/catalog.html`, `/contact.html`.

```bash
npm run build
```

Output is in `dist/` — deploy that folder to any static host.

## Before launch

- Set `link rel="canonical"` and `og:*` URLs in each HTML file to your real domain (currently `https://example.com/...`).  
- Update footer social links (Instagram, Facebook, WhatsApp) and `mailto:` on the contact page.  
- Wire the contact form to your backend or form service if you need real submissions (the UI shows a thank-you message only).

## Optional logo

Add your logo under `assets/logo/` and reference it from the header if you want an image next to the wordmark.

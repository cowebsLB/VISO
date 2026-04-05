# Development environment (Windows and Next.js)

## Port and dev server

- Default dev URL: **`http://localhost:3040`** (see `package.json` / Next config).
- **`npm run dev`** uses **Webpack**; Serwist is off in dev by design.

## Turbopack vs Webpack

- **`npm run dev:turbopack`** can be faster on some machines.
- On **Windows**, Turbopack has been observed to hit **`_buildManifest.js.tmp` ENOENT** and related issues; **Webpack dev** is the recommended default for this repo.

## Corrupt or stale `.next` cache

Symptoms include missing chunk errors (`Cannot find module './NNN.js'`), **`SegmentViewNode` / React Client Manifest** errors, **`ENOENT`** opening **`.next/routes-manifest.json`**, **`GET /_next/static/chunks/app/.../layout.js` 404**, **`ChunkLoadError`** after Fast Refresh, or unexplained **500**s on admin or static routes.

**Common causes:** deleting **`.next`** or running **`npm run clean`** while **`next dev`** is still running; or running **`npm run build`** **in parallel** with **`npm run dev`** (both use **`.next`**).

**Fix:** Stop the dev server (**Ctrl+C**), then:

```bash
npm run clean
```

`npm run clean` runs **`scripts/clean-next.mjs`**, which removes:

- **`.next`**
- **`node_modules/.cache`**

Then start again with **`npm run dev`** (or **`npm run dev:clean`** for one shot).

Avoid deleting **`.next`** while the dev server is still running on Windows (file locks and half-written chunks).

## Webpack cache in dev

**`next.config.ts`** only sets **`webpack.cache = false`** when **`NEXT_DISABLE_WEBPACK_CACHE=true`**. Keeping the default (cache on) reduces HMR / chunk name drift after edits.

## Next.js experimental devtools

In **`next.config.ts`**, **`experimental.devtoolSegmentExplorer`** is set to **`false`** to reduce cascading dev errors after a bad cache when using the segment explorer / webpack dev tooling on Windows.

## Related

- Root **[README.md](../README.md)** — longer troubleshooting for 500s, service workers, base path.

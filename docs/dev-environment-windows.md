# Development environment (Windows and Next.js)

## Port and dev server

- Default dev URL: **`http://localhost:3040`** (see `package.json` / Next config).
- **`npm run dev`** uses **Webpack**; Serwist is off in dev by design.

## Turbopack vs Webpack

- **`npm run dev:turbopack`** can be faster on some machines.
- On **Windows**, Turbopack has been observed to hit **`_buildManifest.js.tmp` ENOENT** and related issues; **Webpack dev** is the recommended default for this repo.

## Corrupt or stale `.next` cache

Symptoms include missing chunk errors (`Cannot find module './NNN.js'`), **`SegmentViewNode` / React Client Manifest** errors, or unexplained **500**s on admin or static routes.

**Fix:** Stop the dev server, then:

```bash
npm run clean
```

`npm run clean` runs **`scripts/clean-next.mjs`**, which removes:

- **`.next`**
- **`node_modules/.cache`**

Then start again with **`npm run dev`** (or **`npm run dev:clean`** for one shot).

Avoid deleting **`.next`** while the dev server is still running on Windows (file locks and half-written chunks).

## Next.js experimental devtools

In **`next.config.ts`**, **`experimental.devtoolSegmentExplorer`** is set to **`false`** to reduce cascading dev errors after a bad cache when using the segment explorer / webpack dev tooling on Windows.

## Related

- Root **[README.md](../README.md)** — longer troubleshooting for 500s, service workers, base path.

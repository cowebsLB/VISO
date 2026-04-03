import { rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const paths = [join(root, ".next"), join(root, "node_modules", ".cache")];

for (const dir of paths) {
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log("Removed:", dir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Could not remove", dir, message);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(
    "Next: stop any dev server on this repo, then npm run dev. If layout.css / main-app.js still 404, hard-reload once after SW purge or check NEXT_PUBLIC_FORCE_BASE_PATH_IN_DEV vs your URL.",
  );
}

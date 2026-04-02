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

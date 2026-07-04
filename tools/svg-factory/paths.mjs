import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const sheetsDir = join(root, "tools/svg-factory/sheets");
export const generatedDir = join(root, "assets/generated");
export const previewsDir = join(root, "assets/previews");

export function relativePath(path, base = root) {
  return path.replace(`${base}/`, "");
}

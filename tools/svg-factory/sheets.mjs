import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { sheetsDir } from "./paths.mjs";

export function listSheets({ sheetsDirectory = sheetsDir } = {}) {
  return readdirSync(sheetsDirectory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
}

export function loadSheet(name, { sheetsDirectory = sheetsDir } = {}) {
  const file = join(sheetsDirectory, `${name}.json`);
  if (!existsSync(file)) {
    throw new Error(`Unknown sheet "${name}". Run "npm run asset:list".`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

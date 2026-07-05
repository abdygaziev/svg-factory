import { execFileSync as defaultExecFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { validateSheetName } from "./names.mjs";
import { generatedDir, previewsDir, relativePath } from "./paths.mjs";

export function previewSheet(
  name,
  {
    generatedDirectory = generatedDir,
    previewsDirectory = previewsDir,
    commandExists = defaultCommandExists,
    execFileSync = defaultExecFileSync
  } = {}
) {
  const safeName = validateSheetName(name);
  const svgPath = join(generatedDirectory, `${safeName}.svg`);
  if (!existsSync(svgPath)) {
    throw new Error(`Missing generated SVG: ${relativePath(svgPath)}. Run generate first.`);
  }

  const renderer = selectPreviewRenderer({ commandExists });
  mkdirSync(previewsDirectory, { recursive: true });
  const outPath = join(previewsDirectory, `${safeName}.png`);
  const [command, args] = buildPreviewCommand(renderer, svgPath, outPath);
  execFileSync(command, args, { stdio: "ignore" });
  return outPath;
}

export function selectPreviewRenderer({ commandExists = defaultCommandExists } = {}) {
  if (commandExists("inkscape")) return { name: "inkscape" };
  if (commandExists("sips")) return { name: "sips" };
  throw new Error("No preview renderer found. Install Inkscape, or run on macOS with sips.");
}

export function buildPreviewCommand(renderer, svgPath, outPath) {
  if (renderer.name === "inkscape") {
    return ["inkscape", [svgPath, "--export-type=png", `--export-filename=${outPath}`]];
  }
  if (renderer.name === "sips") {
    return ["sips", ["-s", "format", "png", svgPath, "--out", outPath]];
  }
  throw new Error(`Unsupported preview renderer: ${renderer.name}`);
}

export function defaultCommandExists(command) {
  try {
    defaultExecFileSync("sh", ["-lc", `command -v ${shellQuote(command)}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { renderDefinitionFile } from "./document.mjs";
import { generatedDir, relativePath } from "./paths.mjs";
import { previewSheet } from "./preview.mjs";
import { renderSheet } from "./render.mjs";
import { loadSheet, listSheets } from "./sheets.mjs";
import { validateSheet } from "./validate.mjs";

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  if (command === "render") return renderCommand(args);
  if (command === "list") return listSheetsCommand();
  if (command === "generate") return generateCommand(args);
  if (command === "preview") return previewCommand(args);
  return help();
}

function help() {
  console.log(`SVG Factory

Commands:
  render <definition.json> --out <file.svg>
                               Render a standalone SVG definition file
  list                         List available sheets
  generate [sheet-name]         Generate one sheet, or all sheets when omitted
  preview [sheet-name]          Render generated SVG previews when local tools allow it

Examples:
  svg-factory render icon.json --out icon.svg
  npm run asset:list
  node tools/svg-factory/cli.mjs generate byzantium-pilot
  node tools/svg-factory/cli.mjs preview byzantium-pilot
`);
}

function renderCommand(args) {
  const { input, output } = parseRenderArgs(args);
  const out = renderDefinitionFile(input, { outputPath: output });
  console.log(`rendered ${relativePath(out)}`);
}

function listSheetsCommand() {
  for (const sheet of listSheets()) {
    console.log(sheet);
  }
}

function generateCommand(args) {
  const outputDir = process.env.SVG_FACTORY_GENERATED_DIR || generatedDir;
  mkdirSync(outputDir, { recursive: true });
  const targets = args[0] ? [args[0]] : listSheets();

  for (const name of targets) {
    const sheet = validateSheet(loadSheet(name));
    const svg = renderSheet(sheet);
    const out = join(outputDir, `${sheet.name}.svg`);
    writeFileSync(out, svg);
    console.log(`generated ${relativePath(out)}`);
  }
}

function previewCommand(args) {
  const targets = args[0] ? [args[0]] : listSheets();

  for (const name of targets) {
    const out = previewSheet(name);
    console.log(`preview ${relativePath(out)}`);
  }
}

function parseRenderArgs(args) {
  const input = args[0];
  if (!input || input === "--out") {
    throw new Error("Usage: svg-factory render <definition.json> --out <file.svg>");
  }

  const outIndex = args.indexOf("--out");
  if (outIndex === -1 || !args[outIndex + 1]) {
    throw new Error("Missing output path. Usage: svg-factory render <definition.json> --out <file.svg>");
  }

  return { input, output: args[outIndex + 1] };
}

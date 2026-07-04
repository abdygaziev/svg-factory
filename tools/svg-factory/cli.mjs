#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  if (command === "list") return listSheetsCommand();
  if (command === "generate") return generateCommand(args);
  if (command === "preview") return previewCommand(args);
  return help();
}

function help() {
  console.log(`SVG Factory

Commands:
  list                         List available sheets
  generate [sheet-name]         Generate one sheet, or all sheets when omitted
  preview [sheet-name]          Render generated SVG previews when local tools allow it

Examples:
  npm run asset:list
  node tools/svg-factory/cli.mjs generate byzantium-pilot
  node tools/svg-factory/cli.mjs preview byzantium-pilot
`);
}

function listSheetsCommand() {
  for (const sheet of listSheets()) {
    console.log(sheet);
  }
}

function generateCommand(args) {
  mkdirSync(generatedDir, { recursive: true });
  const targets = args[0] ? [args[0]] : listSheets();

  for (const name of targets) {
    const sheet = validateSheet(loadSheet(name));
    const svg = renderSheet(sheet);
    const out = join(generatedDir, `${sheet.name}.svg`);
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

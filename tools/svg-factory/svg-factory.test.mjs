import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { generatedDir, root } from "./paths.mjs";
import { renderSheet } from "./render.mjs";
import { primitiveRenderers, rendererTypes } from "./renderers.mjs";
import { loadSheet, listSheets } from "./sheets.mjs";
import { styleContract } from "./style.mjs";
import { validateSheet } from "./validate.mjs";
import { buildPreviewCommand, previewSheet, selectPreviewRenderer } from "./preview.mjs";

test("loads the Byzantium pilot sheet", () => {
  const sheet = loadSheet("byzantium-pilot");

  assert.equal(sheet.name, "byzantium-pilot");
  assert.equal(sheet.width, 1600);
  assert.equal(sheet.height, 900);
  assert.equal(sheet.items.length, 8);
});

test("renders deterministic structural markers for the pilot sheet", () => {
  const sheet = loadSheet("byzantium-pilot");
  const svg = renderSheet(sheet);

  assert.match(svg, /^<svg /);
  assert.match(svg, /<title>White Board History - Byzantium Pilot Assets<\/title>/);
  assert.match(svg, /viewBox="0 0 1600 900"/);
  assert.match(svg, /<g id="constantinople-wall-piece"/);
  assert.match(svg, /<g id="verdict-impossible-card"/);
});

test("lists sheets from JSON files in sorted order", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "svg-factory-sheets-"));
  try {
    writeFileSync(join(tempDir, "zulu.json"), "{}");
    writeFileSync(join(tempDir, "alpha.json"), "{}");
    writeFileSync(join(tempDir, "notes.txt"), "");

    assert.deepEqual(listSheets({ sheetsDirectory: tempDir }), ["alpha", "zulu"]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("unknown sheets point users toward listing available sheets", () => {
  assert.throws(
    () => loadSheet("missing-sheet"),
    /Unknown sheet "missing-sheet"\. Run "npm run asset:list"\./
  );
});

test("CLI generate writes the pilot sheet with structural markers", () => {
  execFileSync("node", ["tools/svg-factory/cli.mjs", "generate", "byzantium-pilot"], {
    cwd: root,
    stdio: "pipe"
  });

  const svg = readFileSync(join(generatedDir, "byzantium-pilot.svg"), "utf8");
  assert.match(svg, /<title>White Board History - Byzantium Pilot Assets<\/title>/);
  assert.match(svg, /viewBox="0 0 1600 900"/);
  assert.match(svg, /<g id="constantinople-wall-piece"/);
});

test("every style accent validates and renders to its configured color", () => {
  for (const [accentName, color] of Object.entries(styleContract.palette.accents)) {
    const sheet = makeSheet({
      id: `accent-${accentName}`,
      accent: accentName,
      label: accentName
    });

    assert.doesNotThrow(() => validateSheet(sheet));
    assert.ok(renderSheet(sheet).includes(color));
  }
});

test("generated CSS uses the shared style contract", () => {
  const svg = renderSheet(loadSheet("byzantium-pilot"));
  const { palette, strokes, typography, card } = styleContract;

  assert.match(svg, new RegExp(`stroke:${palette.cardStroke};stroke-width:${card.strokeWidth}`));
  assert.match(svg, new RegExp(`stroke:${palette.ink};stroke-width:${strokes.primary}`));
  assert.match(svg, new RegExp(`stroke:${palette.ink};stroke-width:${strokes.thin}`));
  assert.match(svg, new RegExp(`font-size:${typography.labelSize}px`));
  assert.match(svg, new RegExp(`fill:${palette.muted}`));
});

test("unsupported accents fail validation before rendering", () => {
  assert.throws(
    () => validateSheet(makeSheet({ id: "bad-accent", accent: "imperial-blue" })),
    /Item "bad-accent" uses unsupported accent "imperial-blue"/
  );
});

test("validation rejects duplicate item ids", () => {
  const sheet = {
    ...makeSheet(),
    items: [
      makeItem({ id: "duplicate" }),
      makeItem({ id: "duplicate", x: 320 })
    ]
  };

  assert.throws(() => validateSheet(sheet), /Duplicate item id: duplicate/);
});

test("validation rejects invalid item geometry and renderer types", () => {
  assert.throws(() => validateSheet(null), /Sheet must be an object/);
  assert.throws(
    () =>
      validateSheet({
        name: "bad-sheet",
        title: "Bad Sheet",
        width: 1600,
        height: 900,
        items: [null]
      }),
    /Sheet items must be objects/
  );

  assert.throws(
    () => validateSheet(makeSheet({ id: "bad-x", x: Number.NaN })),
    /Item "bad-x" has invalid x/
  );

  assert.throws(
    () => validateSheet(makeSheet({ id: "unknown-renderer", type: "timeline" })),
    /Item "unknown-renderer" uses unsupported renderer type "timeline"/
  );
});

test("labels with XML-sensitive characters render escaped text", () => {
  const svg = renderSheet(makeSheet({ label: "Coins & <tribute> \"due\"" }));

  assert.match(svg, /Coins &amp; &lt;tribute&gt; &quot;due&quot;/);
  assert.doesNotMatch(svg, /<tribute>/);
});

test("meter values must stay within the documented 0..1 range", () => {
  assert.throws(
    () => validateSheet(makeSheet({ id: "bad-meter", type: "meter", value: 1.4 })),
    /Item "bad-meter" has invalid value/
  );
});

test("renderer registry exposes every primitive used by the pilot sheet", () => {
  const sheet = loadSheet("byzantium-pilot");
  const usedTypes = new Set(sheet.items.map((item) => item.type));

  for (const type of usedTypes) {
    assert.equal(typeof primitiveRenderers[type], "function");
    assert.ok(rendererTypes.includes(type));
  }
});

test("custom card dimensions override defaults without changing labels", () => {
  const svg = renderSheet(makeSheet({ cardWidth: 512, cardHeight: 144, label: "Custom Card" }));

  assert.match(svg, /width="512" height="144"/);
  assert.match(svg, />Custom Card<\/text>/);
});

test("repeated renders of the same sheet are deterministic", () => {
  const sheet = loadSheet("byzantium-pilot");

  assert.equal(renderSheet(sheet), renderSheet(sheet));
});

test("preview selection prefers Inkscape and falls back to sips", () => {
  assert.equal(selectPreviewRenderer({ commandExists: (command) => command === "inkscape" }).name, "inkscape");
  assert.equal(selectPreviewRenderer({ commandExists: (command) => command === "sips" }).name, "sips");
  assert.equal(selectPreviewRenderer({ commandExists: () => true }).name, "inkscape");
});

test("preview commands use the expected renderer arguments", () => {
  assert.deepEqual(
    buildPreviewCommand({ name: "inkscape" }, "in.svg", "out.png"),
    ["inkscape", ["in.svg", "--export-type=png", "--export-filename=out.png"]]
  );
  assert.deepEqual(
    buildPreviewCommand({ name: "sips" }, "in.svg", "out.png"),
    ["sips", ["-s", "format", "png", "in.svg", "--out", "out.png"]]
  );
});

test("preview reports missing generated SVGs and missing renderers clearly", () => {
  assert.throws(
    () => previewSheet("missing-sheet"),
    /Missing generated SVG: assets\/generated\/missing-sheet\.svg\. Run generate first\./
  );

  const tempDir = mkdtempSync(join(tmpdir(), "svg-factory-preview-"));
  try {
    const generated = join(tempDir, "generated");
    const previews = join(tempDir, "previews");
    mkdirSync(generated, { recursive: true });
    writeFileSync(join(generated, "demo.svg"), "<svg></svg>");

    assert.throws(
      () =>
        previewSheet("demo", {
          generatedDirectory: generated,
          previewsDirectory: previews,
          commandExists: () => false,
          execFileSync: () => {}
        }),
      /No preview renderer found\. Install Inkscape, or run on macOS with sips\./
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("preview writes PNGs to the preview directory for a requested sheet", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "svg-factory-preview-write-"));
  try {
    const generated = join(tempDir, "generated");
    const previews = join(tempDir, "previews");
    mkdirSync(generated, { recursive: true });
    writeFileSync(join(generated, "demo.svg"), "<svg></svg>");

    const out = previewSheet("demo", {
      generatedDirectory: generated,
      previewsDirectory: previews,
      commandExists: (command) => command === "sips",
      execFileSync: (command, args) => {
        assert.equal(command, "sips");
        writeFileSync(args.at(-1), "png");
      }
    });

    assert.equal(out, join(previews, "demo.png"));
    assert.equal(readFileSync(out, "utf8"), "png");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("docs list package commands and style accents from the executable contract", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const factoryReadme = readFileSync(join(root, "tools/svg-factory/README.md"), "utf8");
  const assetsReadme = readFileSync(join(root, "assets/README.md"), "utf8");

  for (const commandName of ["asset:list", "asset:generate", "asset:preview", "asset:all"]) {
    assert.ok(packageJson.scripts[commandName], `missing package script ${commandName}`);
    assert.match(factoryReadme, new RegExp(`npm run ${commandName}`));
    assert.match(assetsReadme, new RegExp(`npm run ${commandName}`));
  }

  for (const [accentName, color] of Object.entries(styleContract.palette.accents)) {
    const label = titleCase(accentName);
    assert.ok(factoryReadme.includes(`${label}: \`${color}\``), `factory README missing ${label}`);
    assert.ok(assetsReadme.includes(`${label}: \`${color}\``), `assets README missing ${label}`);
  }
});

function makeSheet(item = {}) {
  return {
    name: "test-sheet",
    title: "Test Sheet",
    width: 1600,
    height: 900,
    items: [makeItem(item)]
  };
}

function makeItem(item = {}) {
  return {
    id: "test-wall",
    type: "wall",
    x: 240,
    y: 160,
    label: "Test Wall",
    ...item
  };
}

function titleCase(value) {
  return value.replace(/(^|-)([a-z])/g, (_match, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

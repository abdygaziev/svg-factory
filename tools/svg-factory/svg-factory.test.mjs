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
import { renderDefinitionFile, renderSvgDocument } from "./document.mjs";
import { validateSvgDocument } from "./document-validate.mjs";

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

test("package exposes a standalone svg-factory binary and render script", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

  assert.equal(packageJson.bin["svg-factory"], "tools/svg-factory/cli.mjs");
  assert.equal(packageJson.scripts["svg:render"], "node tools/svg-factory/cli.mjs render");
});

test("renders a generic SVG document definition without custom primitive code", () => {
  const svg = renderSvgDocument(makeDocument());

  assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="320" height="180" viewBox="0 0 320 180">/);
  assert.match(svg, /<title>Agent Demo<\/title>/);
  assert.match(svg, /<g id="badge">/);
  assert.match(svg, /<rect id="badge-card" x="16" y="16" width="96" height="64" rx="8" fill="#ffffff" stroke="#111111" stroke-width="3"\/>/);
  assert.match(svg, /<text id="badge-label" x="160" y="120" fill="#111111" font-size="20" font-family="Arial,sans-serif" text-anchor="middle">Safe &amp; editable<\/text>/);
});

test("CLI render writes a generic SVG definition to the requested output path", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "svg-factory-render-"));
  try {
    const input = join(tempDir, "agent-demo.json");
    const output = join(tempDir, "agent-demo.svg");
    writeFileSync(input, JSON.stringify(makeDocument(), null, 2));

    execFileSync("node", ["tools/svg-factory/cli.mjs", "render", input, "--out", output], {
      cwd: root,
      stdio: "pipe"
    });

    const svg = readFileSync(output, "utf8");
    assert.match(svg, /<title>Agent Demo<\/title>/);
    assert.match(svg, /<circle id="badge-dot" cx="220" cy="52" r="28" fill="#7c3aed"\/>/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("standalone render accepts existing sheet definitions too", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "svg-factory-render-sheet-"));
  try {
    const output = join(tempDir, "byzantium-pilot.svg");

    renderDefinitionFile(join(root, "tools/svg-factory/sheets/byzantium-pilot.json"), { outputPath: output });

    const svg = readFileSync(output, "utf8");
    assert.match(svg, /<title>White Board History - Byzantium Pilot Assets<\/title>/);
    assert.match(svg, /<g id="constantinople-wall-piece"/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("generic SVG definitions validate creator-facing errors before rendering", () => {
  assert.throws(() => validateSvgDocument(null), /SVG document must be an object/);
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-doc",
        title: "Bad Doc",
        width: 320,
        height: 180,
        elements: [{ id: "missing-kind", x: 10 }]
      }),
    /Element "missing-kind" missing required key "kind"/
  );
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-doc",
        title: "Bad Doc",
        width: 320,
        height: 180,
        elements: [{ id: "bad-kind", kind: "script" }]
      }),
    /Element "bad-kind" uses unsupported kind "script"/
  );
  assert.throws(
    () =>
      renderSvgDocument({
        name: "bad-color",
        title: "Bad Color",
        width: 320,
        height: 180,
        elements: [{ id: "unsafe-color", kind: "circle", cx: 20, cy: 20, r: 10, fill: "url(javascript:alert(1))" }]
      }),
    /Element "unsafe-color" has invalid fill/
  );
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-doc",
        title: "Bad Doc",
        width: 320,
        height: 180,
        elements: [
          {
            id: "duplicate",
            kind: "group",
            children: [{ id: "duplicate", kind: "circle", cx: 20, cy: 20, r: 10 }]
          }
        ]
      }),
    /Duplicate element id: duplicate/
  );
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-doc",
        title: "Bad Doc",
        width: 320,
        height: 180,
        elements: [{ id: "bad-group", kind: "group", children: {} }]
      }),
    /Element "bad-group" has invalid children/
  );
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-doc",
        title: "Bad Doc",
        width: 320,
        height: 180,
        elements: [{ id: "bad-radius", kind: "circle", cx: 20, cy: 20, r: -1 }]
      }),
    /Element "bad-radius" has invalid r: expected a non-negative number/
  );
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-doc",
        title: "Bad Doc",
        width: 320,
        height: 180,
        elements: [{ id: "bad-width", kind: "rect", x: 0, y: 0, width: -1, height: 10 }]
      }),
    /Element "bad-width" has invalid width: expected a non-negative number/
  );
});

test("generic SVG render supports all standalone shape kinds", () => {
  const svg = renderSvgDocument({
    name: "shape-demo",
    title: "Shape Demo",
    width: 320,
    height: 180,
    elements: [
      { id: "ellipse-demo", kind: "ellipse", cx: 40, cy: 40, rx: 20, ry: 10, fill: "none", stroke: "#111111" },
      { id: "line-demo", kind: "line", x1: 10, y1: 90, x2: 90, y2: 90, stroke: "#111111" },
      { id: "path-demo", kind: "path", d: "M10 120 L90 120", stroke: "#111111", fill: "none" },
      { id: "polygon-demo", kind: "polygon", points: "140,20 180,80 100,80", fill: "#7c3aed" },
      { id: "polyline-demo", kind: "polyline", points: "200,20 240,60 280,20", fill: "none", stroke: "#111111" }
    ]
  });

  assert.match(svg, /<ellipse id="ellipse-demo" cx="40" cy="40" rx="20" ry="10" fill="none" stroke="#111111"\/>/);
  assert.match(svg, /<line id="line-demo" x1="10" y1="90" x2="90" y2="90" stroke="#111111"\/>/);
  assert.match(svg, /<path id="path-demo" d="M10 120 L90 120" fill="none" stroke="#111111"\/>/);
  assert.match(svg, /<polygon id="polygon-demo" points="140,20 180,80 100,80" fill="#7c3aed"\/>/);
  assert.match(svg, /<polyline id="polyline-demo" points="200,20 240,60 280,20" fill="none" stroke="#111111"\/>/);
});

test("generic CLI render reports usage errors", () => {
  assert.throws(
    () => execFileSync("node", ["tools/svg-factory/cli.mjs", "render", "--out"], { cwd: root, stdio: "pipe" }),
    /Usage: svg-factory render <definition\.json> --out <file\.svg>/
  );
  assert.throws(
    () => execFileSync("node", ["tools/svg-factory/cli.mjs", "render", "icon.json"], { cwd: root, stdio: "pipe" }),
    /Missing output path/
  );
});

test("generic SVG rendering escapes text and attribute payloads", () => {
  const svg = renderSvgDocument({
    name: "escape-demo",
    title: "Escape <Demo>",
    width: 320,
    height: 180,
    background: "#ffffff",
    elements: [
      {
        id: "safe-path",
        kind: "path",
        d: "M0 0 L10 10\" onload=\"alert(1)",
        className: "x\" onclick=\"alert(1)",
        transform: "translate(0 0)\" onload=\"alert(1)",
        stroke: "#111111",
        fill: "none"
      },
      {
        id: "safe-text",
        kind: "text",
        x: 20,
        y: 20,
        text: "<script>alert(1)</script>",
        fontFamily: "Arial,\" onload=\"alert(1)",
        fill: "#111111"
      }
    ]
  });

  assert.match(svg, /<title>Escape &lt;Demo&gt;<\/title>/);
  assert.match(svg, /d="M0 0 L10 10&quot; onload=&quot;alert\(1\)"/);
  assert.match(svg, /class="x&quot; onclick=&quot;alert\(1\)"/);
  assert.match(svg, /font-family="Arial,&quot; onload=&quot;alert\(1\)"/);
  assert.match(svg, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(svg, /<script>/);
  assert.doesNotMatch(svg, / onload="/);
});

test("generic SVG validation rejects unsafe paint values on background and stroke", () => {
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-background",
        title: "Bad Background",
        width: 320,
        height: 180,
        background: "url(javascript:alert(1))",
        elements: []
      }),
    /SVG document has invalid background/
  );
  assert.throws(
    () =>
      validateSvgDocument({
        name: "bad-stroke",
        title: "Bad Stroke",
        width: 320,
        height: 180,
        elements: [{ id: "bad-stroke", kind: "line", x1: 0, y1: 0, x2: 10, y2: 10, stroke: "data:text/html,hi" }]
      }),
    /Element "bad-stroke" has invalid stroke/
  );
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

function makeDocument() {
  return {
    name: "agent-demo",
    title: "Agent Demo",
    width: 320,
    height: 180,
    background: "#ffffff",
    elements: [
      {
        id: "badge",
        kind: "group",
        children: [
          {
            id: "badge-card",
            kind: "rect",
            x: 16,
            y: 16,
            width: 96,
            height: 64,
            rx: 8,
            fill: "#ffffff",
            stroke: "#111111",
            strokeWidth: 3
          },
          {
            id: "badge-dot",
            kind: "circle",
            cx: 220,
            cy: 52,
            r: 28,
            fill: "#7c3aed"
          },
          {
            id: "badge-label",
            kind: "text",
            x: 160,
            y: 120,
            text: "Safe & editable",
            fill: "#111111",
            fontSize: 20,
            fontFamily: "Arial,sans-serif",
            textAnchor: "middle"
          }
        ]
      }
    ]
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

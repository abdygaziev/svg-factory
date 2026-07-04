---
name: svg-factory
description: Generate, validate, and preview editable SVG assets with the svg-factory CLI. Use when an agent needs to create a plain SVG from JSON, render an existing SVG document definition, generate bundled sheet presets, or produce PNG previews from generated SVGs.
---

# SVG Factory

## Overview

Use the `svg-factory` CLI to create deterministic, editable SVG files from JSON definitions. Prefer it when the user asks for vector assets, icon sheets, catalogue-card style assets, or generated SVGs that should remain hand-editable and reproducible.

## Find the CLI

Start in the current workspace. If `package.json` has `"name": "svg-factory-tool"` or `tools/svg-factory/cli.mjs` exists, run the local CLI:

```bash
node tools/svg-factory/cli.mjs render definition.json --out asset.svg
```

If the package is installed as a dependency or globally, use the package binary:

```bash
svg-factory render definition.json --out asset.svg
```

If only npm package access is available, use:

```bash
npx --yes svg-factory-tool render definition.json --out asset.svg
```

## Core Workflow

1. Write or update a JSON SVG definition with a stable `name`, `title`, numeric `width` and `height`, optional `background`, and ordered `elements`.
2. Give every element a stable unique `id`.
3. Use supported element kinds only: `group`, `rect`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, and `text`.
4. Render with `svg-factory render <definition.json> --out <file.svg>`.
5. Inspect the generated SVG when layout matters. Iterate on the JSON source, not the generated SVG.

Minimal definition:

```json
{
  "name": "agent-demo",
  "title": "Agent Demo",
  "width": 320,
  "height": 180,
  "background": "#ffffff",
  "elements": [
    {
      "id": "label",
      "kind": "text",
      "x": 160,
      "y": 96,
      "text": "Editable SVG",
      "fill": "#111111",
      "fontSize": 24,
      "fontFamily": "Arial,sans-serif",
      "textAnchor": "middle"
    }
  ]
}
```

## Preset Sheets

Use sheet commands only in a repository checkout that includes `tools/svg-factory/sheets/`.

```bash
svg-factory list
svg-factory generate
svg-factory generate byzantium-pilot
svg-factory preview byzantium-pilot
```

`generate` writes reproducible SVGs to `assets/generated/`. `preview` writes PNG previews to `assets/previews/` when Inkscape or macOS `sips` is available.

## Guardrails

- Keep generated SVGs reproducible from JSON source.
- Do not hand-edit files under `assets/generated/` as source.
- Prefer plain SVG primitives over embedded raster images.
- Run `npm test` in the package checkout after changing CLI behavior, validation rules, renderers, or sheet schemas.

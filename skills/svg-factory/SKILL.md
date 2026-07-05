---
name: svg-factory
description: Generate, validate, and preview deterministic editable SVG assets with the svg-factory CLI. Use when an agent needs to create plain SVG from JSON, render an existing SVG document definition, generate bundled sheet presets, or produce PNG previews from generated SVGs without hand-authoring final SVG markup.
---

# SVG Factory

## When to Use

Use `svg-factory` when the output should be a plain, editable, reproducible SVG rather than a raster image or a one-off hand-written SVG.

Good fits:

- Vector assets, icons, diagrams, badges, simple illustrations, and asset sheets.
- SVGs that should remain hand-editable and deterministic from JSON source.
- White Board History catalogue-card style sheets using bundled presets.
- PNG previews of generated SVGs when local preview tools are available.

Poor fits:

- Photorealistic, painterly, or texture-heavy bitmap art.
- Interactive web UI or animation work.
- Complex freehand vector illustration where JSON primitives would be slower than direct design tooling.

## Find the CLI

Start in the current workspace. If `package.json` has `"name": "svg-factory-tool"` or `tools/svg-factory/cli.mjs` exists, prefer the local checkout:

```bash
node tools/svg-factory/cli.mjs render definition.json --out asset.svg
```

The repo also exposes npm scripts:

```bash
npm run svg:render -- definition.json --out asset.svg
npm run asset:list
npm run asset:generate
npm run asset:preview
npm run asset:all
```

If the package is installed as a dependency or globally, use:

```bash
svg-factory render definition.json --out asset.svg
```

If only npm package access is available, use the published package:

```bash
npx --yes svg-factory-tool render definition.json --out asset.svg
```

## Standalone SVG Workflow

Use standalone definitions for ordinary SVG assets that do not need a custom primitive renderer.

1. Write or update a JSON SVG definition with a stable `name`, `title`, positive numeric `width` and `height`, optional `background`, and ordered `elements`.
2. Give every element a stable unique `id`.
3. Use supported element kinds only: `group`, `rect`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, and `text`.
4. Prefer simple primitives and grouped structure over opaque path-only output when editability matters.
5. Render with `svg-factory render <definition.json> --out <file.svg>`.
6. Inspect the generated SVG when layout matters. Iterate on the JSON source, not the generated SVG.

The standalone validator rejects malformed documents, duplicate IDs, unsupported element kinds, invalid geometry, unsafe paint values, and malformed groups before writing output.

Allowed paint values are named colors, hex colors, `currentColor`, and `none`. Avoid URL paints, embedded scripts, external assets, and inline event handlers.

Common element attributes:

- `fill`, `stroke`, `strokeWidth`
- `opacity`
- `transform`
- `className`

Text defaults to black Arial-style text unless overridden with `fill`, `fontSize`, `fontFamily`, or `textAnchor`. Supported `textAnchor` values are `start`, `middle`, and `end`.

Minimal standalone definition:

```json
{
  "name": "agent-demo",
  "title": "Agent Demo",
  "width": 320,
  "height": 180,
  "background": "#ffffff",
  "elements": [
    {
      "id": "badge",
      "kind": "group",
      "children": [
        {
          "id": "badge-card",
          "kind": "rect",
          "x": 16,
          "y": 16,
          "width": 288,
          "height": 148,
          "rx": 8,
          "fill": "#ffffff",
          "stroke": "#111111",
          "strokeWidth": 3
        },
        {
          "id": "badge-label",
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
  ]
}
```

Render it:

```bash
svg-factory render agent-demo.json --out agent-demo.svg
```

## Sheet Preset Workflow

Use sheet presets only in a repository checkout that includes `tools/svg-factory/sheets/`.

```bash
svg-factory list
svg-factory generate
svg-factory generate byzantium-pilot
svg-factory preview byzantium-pilot
```

Equivalent local scripts:

```bash
npm run asset:list
npm run asset:generate
npm run asset:preview
npm run asset:all
```

`generate` writes reproducible SVGs to `assets/generated/`. `preview` writes PNG previews to `assets/previews/` when Inkscape or macOS `sips` is available.

Use sheet presets when the user wants the White Board History catalogue-card style. Edit sheet JSON under `tools/svg-factory/sheets/`; do not edit `assets/generated/` as source.

Sheet root fields:

- `name` - stable sheet identifier and generated filename base
- `title` - SVG title text
- `width`, `height` - positive numeric canvas dimensions
- `items` - ordered catalogue items

Item fields:

- `id` - stable SVG group id
- `type` - registered primitive renderer name
- `x`, `y` - center position on the sheet
- `label` - visible catalogue label
- `accent` - optional supported accent name
- `cardWidth`, `cardHeight` - optional positive numeric card overrides
- `value` - optional 0..1 value for meter-like primitives
- additional type-specific renderer props

If validation fails, fix the JSON or renderer contract rather than bypassing validation.

## Style Contract

For sheet presets, keep the generator aligned with `tools/svg-factory/style.mjs`. Do not duplicate palette, stroke, typography, or card defaults in ad hoc renderers.

Current accent names:

- `byzantium`
- `ottomans`
- `venice`
- `castile`
- `france`
- `ming`
- `aztec`
- `neutral`

When adding a new primitive renderer, register it in `tools/svg-factory/renderers.mjs`, reuse shared helpers for cards, labels, accents, and escaping, then add focused tests in `tools/svg-factory/svg-factory.test.mjs`.

## Preview and QA

For standalone assets, inspect the generated SVG directly or render it with the user's requested tool.

For sheet presets:

1. Run `npm run asset:generate` or `svg-factory generate <sheet-name>`.
2. Run `npm run asset:preview` or `svg-factory preview <sheet-name>` when a PNG preview is useful.
3. If preview says the generated SVG is missing, run generate first.
4. If preview says no renderer is available, install Inkscape or use macOS `sips`; otherwise inspect the SVG directly.

Preview prefers Inkscape for SVG export fidelity and falls back to `sips`.

## Guardrails

- Keep generated SVGs reproducible from JSON source.
- Do not hand-edit files under `assets/generated/` or `assets/previews/` as source.
- Prefer plain SVG primitives over embedded raster images.
- Use stable, meaningful IDs so the SVG remains easy to edit and import.
- Preserve deterministic ordering in JSON arrays and generated output.
- Keep validation errors creator-facing and specific.
- Run `npm test` in the package checkout after changing CLI behavior, validation rules, renderers, style contracts, preview behavior, or sheet schemas.

## Quick Command Reference

```bash
# Render one standalone JSON definition.
svg-factory render definition.json --out asset.svg

# Local checkout equivalent.
npm run svg:render -- definition.json --out asset.svg

# List bundled sheets.
npm run asset:list

# Generate all bundled sheets, or one named sheet.
npm run asset:generate
node tools/svg-factory/cli.mjs generate byzantium-pilot

# Create PNG previews for generated sheets when local tools allow it.
npm run asset:preview
node tools/svg-factory/cli.mjs preview byzantium-pilot

# Generate and preview all bundled sheets.
npm run asset:all

# Verify code and docs contracts after implementation changes.
npm test
```

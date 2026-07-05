---
name: svg-factory
description: Generate, validate, and preview SVG assets, including polished original vector designs, editable JSON-driven SVGs, heraldic/ornamental emblems, icons, diagrams, badges, and bundled sheet presets. Use when Codex needs to create new SVG artwork, improve SVG design quality, synthesize a design from visual references without copying, render an SVG document definition, or produce PNG previews for QA.
---

# SVG Factory

## When to Use

Use `svg-factory` when the output should be an SVG rather than a raster image.

Good fits:

- Polished original vector designs, icons, diagrams, badges, simple illustrations, emblems, and asset sheets.
- Heraldic, ornamental, historical, fantasy, game, and educational SVG assets.
- SVGs that should remain hand-editable and deterministic from JSON source.
- White Board History catalogue-card style sheets using bundled presets.
- PNG previews of generated SVGs when local preview tools are available.

Poor fits:

- Photorealistic, painterly, or texture-heavy bitmap art.
- Interactive web UI or animation work.
- Exact copies of complex existing artwork unless the user has provided or identified a source SVG and asks to preserve it.

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

## Polished Original Design Workflow

Use this workflow when the user asks for a new polished design, a better-looking generated asset, an emblem, mascot, decorative illustration, historically inspired asset, or a design based on references without copying them.

Read [references/polished-vector-design.md](references/polished-vector-design.md) before creating the asset.

Core loop:

1. Define the design brief in one sentence: subject, audience/use, style direction, output size, and constraints.
2. Extract a motif inventory from references or the prompt: silhouette, pose, repeated shapes, line weight, color role, surface treatment, and must-have symbols.
3. Create a composition plan before writing SVG: canvas ratio, focal hierarchy, large shapes, secondary details, negative-space cuts, and finishing effects.
4. Choose the production mode:
   - Use standalone JSON when the asset can be built from structured primitives and should stay simple and highly editable.
   - Use direct SVG when polish requires gradients, filters, masks, clips, organic paths, nested transforms, or dense ornament.
   - Use imported source SVG only when the user asks for close fidelity to an existing vector source.
5. Build from large to small: field/background, silhouette, interior cuts, color accents, highlights/shadows, then micro-details.
6. Render a PNG preview and critique it against the brief. Iterate at least once when the first result is visibly rough, unbalanced, sparse, or off-style.
7. Deliver the SVG plus source JSON or notes when applicable.

Do not claim a design is close to a reference unless it matches the reference's major structure at a glance. For reference-inspired work, preserve the recognizable design grammar while changing enough geometry and composition to make a new asset.

## Existing Vector Source Workflow

If the user provides or identifies an existing SVG source and asks for close fidelity, do not recreate it from primitive JSON. Preserve or import the source SVG instead, then create previews or derived variants as needed.

Use this path for Wikimedia Commons flags, coats of arms, seals, logos, maps, and other complex vector art where the source file is available. The standalone JSON renderer is for new deterministic assets, not for reproducing hundreds of organic paths from an already-published SVG.

Workflow:

1. Locate the original SVG source, not a PNG/WebP preview, when the user references Wikipedia, Wikimedia Commons, an `.svg.webp` preview, or another rendered derivative.
2. Save the original SVG under `assets/svg/` with a clear filename.
3. Preserve attribution and license details in a nearby source or notes file when the source is licensed.
4. Generate a PNG preview from the imported SVG for visual QA.
5. Only use standalone JSON for simplified redraws, style variants, or new assets where exact source fidelity is not expected.

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

## Reference-Driven Heraldry Workflow

When the user provides a heraldic, flag, banner, seal, or emblem reference image, first match the reference structure before adding stylistic interpretation:

If the reference is a rendered preview of an available source SVG, use the Existing Vector Source Workflow instead of hand-drawing it.

1. Match the canvas shape and field color from the reference. Do not add a shield, badge, card, or caption unless the reference has one or the user asks for it.
2. Identify the signature elements before drawing: number of heads, wing posture, halos/crowns, beaks/tongues, claws, tail ornaments, field color, and whether the figure is free-standing or framed.
3. Build the silhouette with large filled paths first, then layer cut lines, highlights, eyes, beaks, tongues, claws, and ornaments.
4. Use mirrored geometry for symmetric heraldic forms, but keep unique IDs for every element.
5. Prefer named groups like `haloes`, `eagle-silhouette`, `head-details`, `wing-cuts-and-highlights`, and `legs-and-talons` so later edits stay targeted.
6. Generate a PNG preview and compare it against the reference before finishing. If the structure differs, fix the JSON source and rerender.

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

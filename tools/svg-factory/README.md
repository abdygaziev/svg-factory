# SVG Factory

Local no-dependency generator for the White Board History asset style.

The canonical editing surface is:

- `tools/svg-factory/sheets/*.json` for sheet definitions
- `tools/svg-factory/renderers.mjs` for primitive SVG renderers
- `tools/svg-factory/style.mjs` for palette, stroke, typography, and card defaults
- `tools/svg-factory/validate.mjs` for creator-facing sheet and item rules

`assets/generated/` and `assets/previews/` are reproducible outputs. Do not hand-edit them as source.

## Commands

```bash
npm run asset:list
npm run asset:generate
npm run asset:preview
npm run asset:all
```

Generated SVGs are written to `assets/generated/`.
PNG previews are written to `assets/previews/`.

Preview prefers Inkscape for SVG export fidelity and falls back to macOS `sips`.
If neither renderer is available, the command reports the supported options. If the SVG has not been generated yet, run `npm run asset:generate` before previewing.

## Adding Assets

Edit a sheet JSON file under `tools/svg-factory/sheets/`.
Each item has:

- `id` - stable group id in the SVG
- `type` - primitive renderer name
- `x`, `y` - center position on the 1600 x 900 sheet
- `label` - visible catalogue label
- additional type-specific props

Optional shared fields:

- `accent` - one of the supported accent names below; omitted accents resolve to `Neutral`
- `cardWidth`, `cardHeight` - positive numeric card overrides
- `value` - 0..1 for meter-like primitives

Validation fails before writing output when required sheet fields are missing, IDs are duplicated, coordinates or dimensions are not finite numbers, a renderer type is unknown, an accent is unsupported, or XML-sensitive labels would otherwise be unsafe.

## Style Contract

The generator keeps catalogue cards, shadows, font styles, stroke widths, and palette values consistent through `style.mjs`.

- Background: `#ffffff`
- Ink: `#111111`
- Secondary ink: `#6b7280`
- Card stroke: `#e5e7eb`
- Primary stroke: 4 px
- Thin stroke: 2.5 px
- Card radius: 20 px default, with restrained overrides per primitive

Supported accents:

- Byzantium: `#7c3aed`
- Ottomans: `#dc2626`
- Venice: `#0f766e`
- Castile: `#f59e0b`
- France: `#2563eb`
- Ming: `#b91c1c`
- Aztec: `#16a34a`
- Neutral: `#111111`

## Extending Primitives

Add a new primitive by registering one renderer in `tools/svg-factory/renderers.mjs`, then add focused tests in `tools/svg-factory/svg-factory.test.mjs`.
Shared helpers handle cards, labels, accent resolution, XML escaping, and style-contract color checks.
Do not add command routing for a primitive; sheet items select renderers through their `type`.

## Deferred Work

Source-library import, attribution policy, whole-scene recipe generation, SVGO, browser preview UI, and Cavalry automation are follow-up work. This factory only produces plain editable SVG groups and optional PNG previews.

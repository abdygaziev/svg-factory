# SVG Factory

Standalone no-dependency SVG generator for people and agents.
It can render a generic JSON document directly to SVG, and it still includes the White Board History sheet preset workflow.

The canonical editing surface is:

- any JSON file that follows the standalone SVG document shape
- `tools/svg-factory/sheets/*.json` for sheet definitions
- `tools/svg-factory/renderers.mjs` for primitive SVG renderers
- `tools/svg-factory/style.mjs` for palette, stroke, typography, and card defaults
- `tools/svg-factory/validate.mjs` for creator-facing sheet and item rules

`assets/generated/` and `assets/previews/` are reproducible preset outputs. Standalone SVG output goes wherever `--out` points. Do not hand-edit generated output as source.

## Commands

```bash
svg-factory render icon.json --out icon.svg
npm run svg:render -- icon.json --out icon.svg
npm run asset:list
npm run asset:generate
npm run asset:preview
npm run asset:all
```

`render` accepts any standalone SVG document JSON and writes one SVG file. It also accepts the preset sheet JSON shape used in `tools/svg-factory/sheets/`.
Generated SVGs are written to `assets/generated/`.
PNG previews are written to `assets/previews/`.

Preview prefers Inkscape for SVG export fidelity and falls back to macOS `sips`.
If neither renderer is available, the command reports the supported options. If the SVG has not been generated yet, run `npm run asset:generate` before previewing.

## Standalone JSON Shape

Use `render` when an agent needs to create an SVG without adding a custom primitive renderer.
The root document has:

- `name` - stable document identifier
- `title` - SVG `<title>` text
- `width`, `height` - positive numeric canvas dimensions
- `background` - optional named, hex, `currentColor`, or `none` paint
- `elements` - ordered SVG elements

Supported element `kind` values are `group`, `rect`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, and `text`.
Every element needs a stable `id`.

Example:

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
          "width": 96,
          "height": 64,
          "rx": 8,
          "fill": "#ffffff",
          "stroke": "#111111",
          "strokeWidth": 3
        },
        {
          "id": "badge-label",
          "kind": "text",
          "x": 160,
          "y": 120,
          "text": "Safe & editable",
          "fill": "#111111",
          "fontSize": 20,
          "fontFamily": "Arial,sans-serif",
          "textAnchor": "middle"
        }
      ]
    }
  ]
}
```

Standalone validation rejects malformed documents, duplicate IDs, unsupported element kinds, invalid numbers, unsafe paint values, and missing kind-specific geometry before writing output.

Agents can also pass an existing sheet definition to the same command:

```bash
svg-factory render tools/svg-factory/sheets/byzantium-pilot.json --out byzantium-pilot.svg
```

## Adding Assets

Use the sheet preset when you want the White Board History catalogue-card style.
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

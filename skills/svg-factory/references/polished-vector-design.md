# Polished Vector Design

Use this reference when generating new SVG artwork where visual quality matters more than simple primitive editability.

## Design Brief

Before drawing, reduce the request to:

- Subject: what the SVG depicts.
- Use: icon, emblem, banner, diagram, game asset, card art, marker, or decorative element.
- Style: heraldic, flat editorial, engraved, modern geometric, playful, technical, medieval manuscript, etc.
- Canvas: aspect ratio and likely display size.
- Fidelity target: original design, reference-inspired, close variant, or exact preservation of source.

If the user provides a reference and wants a new design, extract the design grammar instead of copying the exact paths.

## Composition Pass

Plan the asset with this order:

1. Canvas and field: aspect ratio, background, border or no border.
2. Focal silhouette: the shape that should read at thumbnail size.
3. Major internal divisions: wings, shields, body, face, tools, buildings, terrain, labels.
4. Rhythm: repeated feathers, rays, waves, bricks, scales, ornaments, or tick marks.
5. Accents: one or two supporting colors that carry meaning.
6. Finish: highlights, shadows, cuts, outlines, halos, glows, texture-like vector marks.

A polished SVG should read clearly at 128 px and still reward inspection at full size.

## SVG Construction Patterns

Use large, named groups:

- `field`
- `main-silhouette`
- `secondary-forms`
- `cuts`
- `accents`
- `highlights`
- `ornament`
- `labels`

Prefer a small set of strong shapes over many weak fragments. Build in layers:

1. Flat base shapes.
2. Dark/light negative-space cuts.
3. Accent color geometry.
4. Subtle highlights and shadows.
5. Small edge details.

For organic or heraldic forms, use `path` with cubic curves. Mirror only where symmetry is important, and then break symmetry with small details if the design should feel hand-finished.

## Polish Criteria

Before finishing, inspect a rendered preview and check:

- Silhouette reads immediately.
- The asset is not mostly empty or mostly one undifferentiated blob.
- Colors have roles: field, ink, accent, highlight, shadow.
- Detail density is highest near the focal area and lower at the edges.
- Stroke widths are intentional and consistent.
- Repeated motifs have rhythm rather than random placement.
- Text, if any, is legible and not the main crutch for meaning.
- The SVG has stable IDs and meaningful groups.

## Common Failure Modes

- Copying a reference source when the user asked for a new design.
- Treating a complex heraldic reference as a checklist instead of matching its silhouette language.
- Using a shield, card, caption, or frame that the prompt did not ask for.
- Overusing flat black paths without cuts, highlights, or interior structure.
- Making everything symmetric when the reference has organic motion.
- Stopping after the first render despite an obviously rough preview.

## Production Mode Guidance

Use standalone JSON when:

- The design is simple, geometric, or diagrammatic.
- The user values easy editing over complex polish.
- The supported element set is enough.

Use direct SVG when:

- The design needs gradients, filters, masks, clip paths, repeated symbols, or organic curves.
- The prompt asks for polished ornament, heraldry, mascot-like figures, banners, seals, or dense decorative assets.
- A preview from JSON looks structurally crude after one iteration.

When using direct SVG, still keep it maintainable: group related elements, use IDs, avoid embedded raster images unless explicitly requested, and render a preview before delivery.

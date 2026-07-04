---
date: 2026-07-04
topic: svg-factory
focus: local Codex-hooked SVG generation tool for white-board-history assets
mode: repo-grounded
---

# Ideation: SVG Factory

## Grounding Context

This repo currently contains a small hand-authored asset pack under `assets/svg/`: faction tokens, map annotations, historical objects, and a Byzantium pilot sheet.
The emerging channel style is a white-background strategy-board format for history explainers: black ink outlines, sparse accent colors, tokens, maps, arrows, meters, and diorama-like historical figures.
The immediate need is not a generic icon browser; it is a repeatable way for Codex to create new SVGs in the same style without manually editing XML every time.

## Topic Axes

- Asset authoring workflow
- Style consistency
- Cavalry import readiness
- Preview and validation
- Future library bootstrapping

## Ranked Ideas

### 1. Definition-driven SVG factory CLI

**Description:** Create a local Node CLI that reads structured asset definitions and renders consistent SVG sheets from reusable primitives: cards, strokes, labels, tokens, arrows, meters, and historical objects.
Codex can add new assets by editing data definitions and generator functions instead of hand-drawing entire SVG files.

**Axis:** Asset authoring workflow

**Basis:** direct: Existing SVG sheets have repeated card, label, stroke, and icon patterns that are already drifting through manual edits.

**Rationale:** A small generator gives us speed and consistency immediately, while still outputting plain editable SVG that Cavalry can import.

**Downsides:** The first primitive set will be limited; unusual assets will still need custom path work.

**Confidence:** 92%

**Complexity:** Medium

### 2. Style-token contract plus validator

**Description:** Define a strict house-style contract in JSON: stroke widths, palette, card sizes, font stack, shadow, label placement, and allowed accent colors.
Add validation so generated assets warn when they use unsupported colors or inconsistent stroke widths.

**Axis:** Style consistency

**Basis:** direct: The channel identity depends on a recognizable visual system rather than one-off AI-looking images.

**Rationale:** Validation prevents the asset library from becoming a pile of unrelated icons.

**Downsides:** Too much validation too early could slow experimentation.

**Confidence:** 82%

**Complexity:** Low

### 3. Preview harness using system renderers

**Description:** Add a CLI command that renders generated SVGs to PNG previews using whatever local renderer exists, starting with macOS `sips` and optionally Inkscape later.
Store previews under `assets/previews/` so visual QA is fast.

**Axis:** Preview and validation

**Basis:** direct: The arrowhead issue only became obvious after rendering the sheet, not from XML validity.

**Rationale:** Fast previews are the difference between a usable visual tool and a code-only SVG toy.

**Downsides:** Renderer behavior differs between `sips`, Inkscape, browsers, and Cavalry.

**Confidence:** 86%

**Complexity:** Low

### 4. Source-library importer for Game-icons and Tabler

**Description:** Add an import command that copies selected open-source SVGs from Game-icons or Tabler into a staging folder, normalizes them to the house style, and records attribution.

**Axis:** Future library bootstrapping

**Basis:** external: Game-icons provides history-adjacent assets under CC BY 3.0; Tabler provides MIT-licensed UI icons on a consistent stroke grid.

**Rationale:** This could expand the asset library quickly while keeping license metadata attached.

**Downsides:** Normalization is nontrivial because filled game icons and stroked Tabler icons need different treatment.

**Confidence:** 68%

**Complexity:** High

### 5. Scene recipe generator

**Description:** Generate whole scene SVGs from recipes like `byzantium-siege`: wall, cannon, Ottoman tokens, Bosporus, treasury meter, and verdict card laid out on a 16:9 canvas.

**Axis:** Cavalry import readiness

**Basis:** reasoned: Cavalry animation starts from a composed scene; generating scene boards reduces setup time more than generating isolated icons alone.

**Rationale:** This moves the workflow closer to actual video production, not just asset collecting.

**Downsides:** Scene recipes risk becoming too specific before the visual language stabilizes.

**Confidence:** 74%

**Complexity:** Medium

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Fully rely on Inkscape extensions | Too much coupling to a GUI tool; Codex automation is easier with plain scripts. |
| 2 | Generate everything with AI image/video tools | Not precise enough for token placement, style consistency, or Cavalry editability. |
| 3 | Build a web app first | Scope overrun; CLI is enough while the asset language is still forming. |
| 4 | Start with library importer first | Useful later, but style primitives should exist before normalizing third-party assets. |
| 5 | Use SVGO as a required dependency | Nice to have, but avoid dependency setup friction for the first working tool. |

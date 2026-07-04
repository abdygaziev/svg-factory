# SVG Factory Tool

Standalone no-dependency SVG generator for people and AI agents.

The package exposes the `svg-factory` CLI and includes an installable Codex-style skill at `skills/svg-factory`.

## CLI

```bash
npm run svg:render -- definition.json --out asset.svg
npm run asset:list
npm run asset:generate
npm run asset:preview
```

Installed package usage:

```bash
svg-factory render definition.json --out asset.svg
```

## Install the Agent Skill

From this checkout:

```bash
npm run skill:install
```

That copies `skills/svg-factory` into `${CODEX_HOME:-$HOME/.codex}/skills`, where Codex-compatible agents can discover it as `$svg-factory`.

Manual install:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R skills/svg-factory "${CODEX_HOME:-$HOME/.codex}/skills/"
```

After installing the skill, ask an agent to use `$svg-factory` when creating editable SVG assets from JSON.

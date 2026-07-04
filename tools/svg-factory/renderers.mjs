import { knownHexColors, resolveAccent, styleContract } from "./style.mjs";

export const primitiveRenderers = Object.freeze({
  wall,
  bosporus,
  cannonBattery,
  reliefShips,
  meter,
  manpower,
  medMap,
  verdict
});

export const rendererTypes = Object.freeze(Object.keys(primitiveRenderers).sort());

export function renderPrimitive(item) {
  const renderer = primitiveRenderers[item.type];
  if (!renderer) {
    throw new Error(`Unsupported renderer type: ${item.type}`);
  }
  return renderer(item);
}

export function renderCard(item, defaults = {}) {
  const width = item.cardWidth ?? defaults.width ?? styleContract.card.width;
  const height = item.cardHeight ?? defaults.height ?? styleContract.card.height;
  const x = -width / 2;
  const y = -(defaults.top ?? styleContract.card.top);
  const radius = defaults.rx ?? styleContract.card.radius;
  return `    <rect class="card" x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/>`;
}

export function renderLabel(item, y = 124) {
  return `    <text class="label" x="0" y="${y}">${escapeXml(item.label)}</text>`;
}

export function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function findUnknownHexColors(svg, contract = styleContract) {
  const allowed = knownHexColors(contract);
  const matches = svg.match(/#[0-9a-fA-F]{6}/g) ?? [];
  return [...new Set(matches.map((color) => color.toLowerCase()))].filter((color) => !allowed.has(color));
}

function wall(item) {
  const color = resolveAccent(item.accent, "byzantium");
  return `${renderCard(item)}
    <path d="M-122 76 V-46 H-90 V-78 H-46 V-46 H-4 V-78 H40 V-46 H84 V-78 H124 V76 Z" fill="#ffffff" class="ink"/>
    <path d="M-94 -4 H94 M-94 36 H94 M-54 -40 V76 M32 -40 V76" fill="none" class="thin"/>
    <path d="M-124 88 C-60 68 6 108 78 84 C104 76 124 78 146 88" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
${renderLabel(item)}`;
}

function bosporus(item) {
  const color = resolveAccent(item.accent, "france");
  return `${renderCard(item, { width: 370 })}
    <path d="M-125 -78 C-20 -38 -74 15 18 40 C78 56 68 100 130 86" fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round" opacity="0.18"/>
    <path d="M-125 -78 C-20 -38 -74 15 18 40 C78 56 68 100 130 86" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <path d="M-84 -2 C-42 -28 4 -8 40 -32 M-44 72 C-5 50 50 80 92 58" fill="none" stroke="${styleContract.palette.muted}" stroke-width="3" stroke-linecap="round"/>
${renderLabel(item)}`;
}

function cannonBattery(item) {
  const color = resolveAccent(item.accent, "ottomans");
  return `${renderCard(item, { width: 360 })}
    <g transform="translate(-56 0)">
      <path d="M-66 8 L42 -32 L58 -10 L-50 32 Z" fill="#ffffff" class="ink"/>
      <circle cx="-42" cy="42" r="19" fill="#ffffff" class="ink"/>
      <circle cx="36" cy="42" r="19" fill="#ffffff" class="ink"/>
      <path d="M70 -14 H100" fill="none" class="ink"/>
      <path d="M110 -14 C132 -30 132 2 110 -14" fill="none" stroke="${color}" stroke-width="5"/>
    </g>
    <path d="M-132 80 H132" fill="none" class="thin"/>
${renderLabel(item)}`;
}

function reliefShips(item) {
  const color = resolveAccent(item.accent, "venice");
  return `${renderCard(item, { width: 300 })}
    <g transform="translate(-42 -8) scale(0.72)">
      <path d="M-96 34 C-64 76 58 76 102 34 Z" fill="#ffffff" class="ink"/>
      <path d="M-38 34 V-72 M-38 -68 L46 -18 L-38 14 Z" fill="#ffffff" class="ink"/>
    </g>
    <g transform="translate(52 20) scale(0.55)">
      <path d="M-96 34 C-64 76 58 76 102 34 Z" fill="#ffffff" class="ink"/>
      <path d="M-38 34 V-72 M-38 -68 L46 -18 L-38 14 Z" fill="#ffffff" class="ink"/>
    </g>
    <path d="M-112 74 C-54 52 0 88 58 68 C86 58 108 60 126 72" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
${renderLabel(item)}`;
}

function meter(item) {
  const color = resolveAccent(item.accent, "byzantium");
  const value = clamp(Number(item.value ?? 0.5), 0, 1);
  const fillWidth = Math.round(238 * value);
  return `${renderCard(item, { width: 400 })}
    <rect x="-126" y="-26" width="252" height="44" rx="22" fill="#ffffff" class="ink"/>
    <rect x="-119" y="-19" width="${fillWidth}" height="30" rx="15" fill="${color}" opacity="0.8"/>
    <path d="M-126 42 H126" fill="none" class="thin"/>
    <text class="small" x="-84" y="68">${escapeXml(item.lowLabel ?? "LOW")}</text>
    <text class="small" x="86" y="68">${escapeXml(item.highLabel ?? "HIGH")}</text>
${renderLabel(item)}`;
}

function manpower(item) {
  return `${renderCard(item, { width: 400 })}
    <g transform="translate(-78 -2)">
      <circle cx="0" cy="-18" r="12" fill="#ffffff" class="ink"/>
      <path d="M0 -4 V34 M-22 10 H22" fill="none" class="ink"/>
    </g>
    <g transform="translate(0 -2)" opacity="0.42">
      <circle cx="0" cy="-18" r="12" fill="#ffffff" class="ink"/>
      <path d="M0 -4 V34 M-22 10 H22" fill="none" class="ink"/>
    </g>
    <g transform="translate(78 -2)" opacity="0.18">
      <circle cx="0" cy="-18" r="12" fill="#ffffff" class="ink"/>
      <path d="M0 -4 V34 M-22 10 H22" fill="none" class="ink"/>
    </g>
${renderLabel(item)}`;
}

function medMap(item) {
  return `${renderCard(item, { width: 520, height: 310, top: 142, rx: 22 })}
    <path d="M-190 -28 C-148 -104 -70 -86 -44 -126 C4 -90 48 -104 84 -40 C138 -28 120 58 48 42 C14 86 -64 72 -84 18 C-140 42 -212 18 -190 -28 Z" fill="#ffffff" class="ink"/>
    <path d="M68 -22 C104 -60 156 -38 184 -72 C226 -36 208 40 154 42 C120 66 88 40 68 -22 Z" fill="#ffffff" class="ink"/>
    <path d="M-48 -18 C-2 18 50 4 88 -26" fill="none" stroke="${styleContract.palette.accents.ottomans}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="-37" cy="-20" r="8" fill="${styleContract.palette.accents.byzantium}"/>
    <circle cx="78" cy="-28" r="8" fill="${styleContract.palette.accents.ottomans}"/>
${renderLabel(item, 154)}`;
}

function verdict(item) {
  return `${renderCard(item, { width: 640, height: 150, top: 82, rx: 22 })}
    <circle cx="-250" cy="-18" r="34" fill="${styleContract.palette.ink}"/>
    <path d="M-264 -18 H-236" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
    <path d="M-180 -40 H235 M-180 -6 H140" fill="none" class="thin"/>
${renderLabel(item, 42)}`;
}

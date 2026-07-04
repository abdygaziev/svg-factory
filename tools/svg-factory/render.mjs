import { escapeXml, findUnknownHexColors, renderPrimitive } from "./renderers.mjs";
import { styleContract } from "./style.mjs";

export function renderSheet(sheet) {
  const body = sheet.items.map((item) => renderItem(item)).join("\n\n");
  const { palette, sheet: sheetStyle } = styleContract;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}" viewBox="0 0 ${sheet.width} ${sheet.height}">
  <title>${escapeXml(sheet.title)}</title>
  <rect width="${sheet.width}" height="${sheet.height}" fill="${sheetStyle.background}"/>
  <defs>
    <filter id="${styleContract.card.shadowId}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="${palette.ink}" flood-opacity="0.08"/>
    </filter>
    <style>
      .card{fill:${sheetStyle.background};stroke:${palette.cardStroke};stroke-width:${styleContract.card.strokeWidth};filter:url(#${styleContract.card.shadowId})}
      .ink{stroke:${palette.ink};stroke-width:${styleContract.strokes.primary};stroke-linecap:round;stroke-linejoin:round}
      .thin{stroke:${palette.ink};stroke-width:${styleContract.strokes.thin};stroke-linecap:round;stroke-linejoin:round}
      .label{font-family:${styleContract.typography.family};font-size:${styleContract.typography.labelSize}px;font-weight:${styleContract.typography.labelWeight};fill:${palette.ink};text-anchor:middle}
      .small{font-family:${styleContract.typography.family};font-size:${styleContract.typography.smallSize}px;font-weight:${styleContract.typography.smallWeight};fill:${palette.muted};text-anchor:middle;letter-spacing:${styleContract.typography.letterSpacing}px}
    </style>
  </defs>

${body}
</svg>
`;

  const unknownColors = findUnknownHexColors(svg);
  if (unknownColors.length > 0) {
    throw new Error(`Generated SVG uses colors outside the style contract: ${unknownColors.join(", ")}`);
  }
  return svg;
}

export function renderItem(item) {
  return `<g id="${escapeXml(item.id)}" transform="translate(${item.x} ${item.y})">
${renderPrimitive(item)}
  </g>`;
}

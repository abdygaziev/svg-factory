import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { escapeXml } from "./renderers.mjs";
import { renderSheet } from "./render.mjs";
import { validateSheet } from "./validate.mjs";
import { validateSvgDocument } from "./document-validate.mjs";
import { geometryFieldsFor } from "./document-kinds.mjs";

const defaultText = Object.freeze({
  fill: "#111111",
  fontFamily: "Arial,sans-serif",
  fontSize: 16,
  textAnchor: "start"
});

export function renderDefinitionFile(inputPath, { outputPath } = {}) {
  if (!outputPath) {
    throw new Error("renderDefinitionFile requires an outputPath");
  }

  const document = JSON.parse(readFileSync(inputPath, "utf8"));
  const svg = renderDefinition(document);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, svg);
  return outputPath;
}

export function renderDefinition(definition) {
  if (definition && typeof definition === "object" && "elements" in definition) {
    return renderSvgDocument(definition);
  }
  if (definition && typeof definition === "object" && "items" in definition) {
    return renderSheet(validateSheet(definition));
  }
  return renderSvgDocument(definition);
}

export function renderSvgDocument(document) {
  const validated = validateSvgDocument(document);
  const background = validated.background
    ? `  <rect width="${validated.width}" height="${validated.height}" fill="${escapeXml(validated.background)}"/>\n`
    : "";
  const body = validated.elements.map((element) => renderElement(element, 1)).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${validated.width}" height="${validated.height}" viewBox="0 0 ${validated.width} ${validated.height}">
  <title>${escapeXml(validated.title)}</title>
${background}${body}
</svg>
`;
}

export function renderElement(element, depth = 0) {
  const indent = "  ".repeat(depth);
  if (element.kind === "group") {
    const attrs = formatAttributes({
      id: element.id,
      class: element.className,
      transform: element.transform,
      opacity: element.opacity
    });
    const children = element.children.map((child) => renderElement(child, depth + 1)).join("\n");
    return `${indent}<g${attrs}>\n${children}\n${indent}</g>`;
  }

  if (element.kind === "text") {
    const attrs = formatAttributes({
      id: element.id,
      class: element.className,
      x: element.x,
      y: element.y,
      fill: element.fill ?? defaultText.fill,
      "font-size": element.fontSize ?? defaultText.fontSize,
      "font-family": element.fontFamily ?? defaultText.fontFamily,
      "text-anchor": element.textAnchor ?? defaultText.textAnchor,
      transform: element.transform,
      opacity: element.opacity
    });
    return `${indent}<text${attrs}>${escapeXml(element.text)}</text>`;
  }

  return `${indent}<${element.kind}${formatElementAttributes(element)}/>`;
}

function formatElementAttributes(element) {
  const attrs = { id: element.id };

  for (const field of geometryFieldsFor(element.kind)) {
    attrs[field] = element[field];
  }

  Object.assign(attrs, {
    class: element.className,
    fill: element.fill,
    stroke: element.stroke,
    "stroke-width": element.strokeWidth,
    transform: element.transform,
    opacity: element.opacity
  });

  return formatAttributes(attrs);
}

function formatAttributes(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
    .join("");
}

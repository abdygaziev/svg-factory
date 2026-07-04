import { rendererTypes } from "./renderers.mjs";
import { accentNames, styleContract } from "./style.mjs";

const sheetRequiredFields = ["name", "title", "width", "height", "items"];
const itemRequiredFields = ["id", "type", "x", "y", "label"];

export function validateSheet(sheet, { contract = styleContract, availableRenderers = rendererTypes } = {}) {
  if (!sheet || typeof sheet !== "object" || Array.isArray(sheet)) {
    throw new Error("Sheet must be an object");
  }

  for (const field of sheetRequiredFields) {
    if (!(field in sheet)) {
      throw new Error(`Sheet missing required key: ${field}`);
    }
  }

  validateString(sheet.name, "Sheet", "name");
  validateString(sheet.title, "Sheet", "title");
  validatePositiveNumber(sheet.width, "Sheet", "width");
  validatePositiveNumber(sheet.height, "Sheet", "height");
  if (!Array.isArray(sheet.items)) {
    throw new Error("Sheet items must be an array");
  }

  const ids = new Set();
  const accents = new Set(accentNames(contract));
  const renderers = new Set(availableRenderers);

  for (const item of sheet.items) {
    validateItem(item, { ids, accents, renderers });
  }

  return sheet;
}

function validateItem(item, { ids, accents, renderers }) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("Sheet items must be objects");
  }

  for (const field of itemRequiredFields) {
    if (!(field in item)) {
      throw new Error(`Item missing required key "${field}": ${JSON.stringify(item)}`);
    }
  }

  validateString(item.id, "Item", "id");
  validateSvgId(item.id);
  if (ids.has(item.id)) {
    throw new Error(`Duplicate item id: ${item.id}`);
  }
  ids.add(item.id);

  validateString(item.type, `Item "${item.id}"`, "type");
  if (!renderers.has(item.type)) {
    throw new Error(`Item "${item.id}" uses unsupported renderer type "${item.type}"`);
  }

  validateNumber(item.x, `Item "${item.id}"`, "x");
  validateNumber(item.y, `Item "${item.id}"`, "y");
  validateString(item.label, `Item "${item.id}"`, "label");
  validateOptionalPositiveNumber(item.cardWidth, `Item "${item.id}"`, "cardWidth");
  validateOptionalPositiveNumber(item.cardHeight, `Item "${item.id}"`, "cardHeight");

  if (item.accent !== undefined && !accents.has(item.accent)) {
    throw new Error(`Item "${item.id}" uses unsupported accent "${item.accent}"`);
  }

  if ((item.type === "meter" || item.type === "manpower") && item.value !== undefined) {
    validateNumber(item.value, `Item "${item.id}"`, "value");
    if (item.value < 0 || item.value > 1) {
      throw new Error(`Item "${item.id}" has invalid value: expected 0..1`);
    }
  }
}

function validateString(value, owner, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${owner} has invalid ${field}: expected a non-empty string`);
  }
}

function validateSvgId(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value)) {
    throw new Error(`Item "${value}" has invalid id: use a stable SVG id`);
  }
}

function validateNumber(value, owner, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${owner} has invalid ${field}: expected a finite number`);
  }
}

function validatePositiveNumber(value, owner, field) {
  validateNumber(value, owner, field);
  if (value <= 0) {
    throw new Error(`${owner} has invalid ${field}: expected a positive number`);
  }
}

function validateOptionalPositiveNumber(value, owner, field) {
  if (value === undefined) return;
  validatePositiveNumber(value, owner, field);
}

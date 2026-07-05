import { descriptorForKind, supportedKinds } from "./document-kinds.mjs";

const documentRequiredFields = ["name", "title", "width", "height", "elements"];
const paintPattern = /^(none|currentColor|#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|[A-Za-z][A-Za-z0-9-]*)$/;
const maxGroupDepth = 64;
const maxElementCount = 5000;

export function validateSvgDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new Error("SVG document must be an object");
  }

  for (const field of documentRequiredFields) {
    if (!(field in document)) {
      throw new Error(`SVG document missing required key: ${field}`);
    }
  }

  validateString(document.name, "SVG document", "name");
  validateString(document.title, "SVG document", "title");
  validatePositiveNumber(document.width, "SVG document", "width");
  validatePositiveNumber(document.height, "SVG document", "height");
  validateOptionalPaint(document.background, "SVG document", "background");

  if (!Array.isArray(document.elements)) {
    throw new Error("SVG document elements must be an array");
  }

  const ids = new Set();
  const state = { elementCount: 0 };
  for (const element of document.elements) {
    validateElement(element, { ids, state, depth: 1 });
  }

  return document;
}

export function validateElement(element, { ids, state = { elementCount: 0 }, depth = 1 }) {
  state.elementCount += 1;
  if (state.elementCount > maxElementCount) {
    throw new Error(`SVG document exceeds maximum element count of ${maxElementCount}`);
  }

  if (!element || typeof element !== "object" || Array.isArray(element)) {
    throw new Error("SVG elements must be objects");
  }

  if (!("id" in element)) {
    throw new Error(`SVG element missing required key "id": ${JSON.stringify(element)}`);
  }
  validateString(element.id, "Element", "id");
  validateSvgId(element.id);
  if (ids.has(element.id)) {
    throw new Error(`Duplicate element id: ${element.id}`);
  }
  ids.add(element.id);

  if (!("kind" in element)) {
    throw new Error(`Element "${element.id}" missing required key "kind"`);
  }
  validateString(element.kind, `Element "${element.id}"`, "kind");
  if (!supportedKinds.includes(element.kind)) {
    throw new Error(`Element "${element.id}" uses unsupported kind "${element.kind}"`);
  }

  validateCommonAttributes(element);
  validateKindSpecificAttributes(element, { ids, state, depth });
}

function validateKindSpecificAttributes(element, { ids, state, depth }) {
  if (element.kind === "group") {
    if (depth > maxGroupDepth) {
      throw new Error(`SVG document exceeds maximum group depth of ${maxGroupDepth}`);
    }
    if (!Array.isArray(element.children)) {
      throw new Error(`Element "${element.id}" has invalid children: expected an array`);
    }
    for (const child of element.children) {
      validateElement(child, { ids, state, depth: depth + 1 });
    }
    return;
  }

  const descriptor = descriptorForKind(element.kind);
  const required = descriptor.required ?? descriptor.geometry ?? [];
  for (const field of required) {
    if (descriptor.strings?.includes(field)) {
      validateString(element[field], `Element "${element.id}"`, field);
    } else if (descriptor.nonNegative?.includes(field)) {
      validateNonNegativeNumber(element[field], `Element "${element.id}"`, field);
    } else {
      validateNumber(element[field], `Element "${element.id}"`, field);
    }
  }
  for (const field of descriptor.geometry ?? []) {
    if (required.includes(field) || element[field] === undefined) continue;
    if (descriptor.nonNegative?.includes(field)) {
      validateNonNegativeNumber(element[field], `Element "${element.id}"`, field);
    } else {
      validateNumber(element[field], `Element "${element.id}"`, field);
    }
  }
  for (const field of descriptor.positive ?? []) {
    validateOptionalPositiveNumber(element[field], `Element "${element.id}"`, field);
  }
  validateOptionalEnum(element.textAnchor, `Element "${element.id}"`, "textAnchor", ["start", "middle", "end"]);
}

function validateCommonAttributes(element) {
  validateOptionalPaint(element.fill, `Element "${element.id}"`, "fill");
  validateOptionalPaint(element.stroke, `Element "${element.id}"`, "stroke");
  validateOptionalPositiveNumber(element.strokeWidth, `Element "${element.id}"`, "strokeWidth");
  validateOptionalNumber(element.opacity, `Element "${element.id}"`, "opacity");
  validateOptionalString(element.transform, `Element "${element.id}"`, "transform");
  validateOptionalString(element.className, `Element "${element.id}"`, "className");
}

function validateString(value, owner, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${owner} has invalid ${field}: expected a non-empty string`);
  }
}

function validateOptionalString(value, owner, field) {
  if (value === undefined) return;
  validateString(value, owner, field);
}

function validateSvgId(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value)) {
    throw new Error(`Element "${value}" has invalid id: use a stable SVG id`);
  }
}

function validateNumber(value, owner, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${owner} has invalid ${field}: expected a finite number`);
  }
}

function validateOptionalNumber(value, owner, field) {
  if (value === undefined) return;
  validateNumber(value, owner, field);
}

function validatePositiveNumber(value, owner, field) {
  validateNumber(value, owner, field);
  if (value <= 0) {
    throw new Error(`${owner} has invalid ${field}: expected a positive number`);
  }
}

function validateNonNegativeNumber(value, owner, field) {
  validateNumber(value, owner, field);
  if (value < 0) {
    throw new Error(`${owner} has invalid ${field}: expected a non-negative number`);
  }
}

function validateOptionalPositiveNumber(value, owner, field) {
  if (value === undefined) return;
  validatePositiveNumber(value, owner, field);
}

function validateOptionalPaint(value, owner, field) {
  if (value === undefined) return;
  validateString(value, owner, field);
  if (!paintPattern.test(value)) {
    throw new Error(`${owner} has invalid ${field}: expected a named color, hex color, currentColor, or none`);
  }
}

function validateOptionalEnum(value, owner, field, allowed) {
  if (value === undefined) return;
  if (!allowed.includes(value)) {
    throw new Error(`${owner} has invalid ${field}: expected one of ${allowed.join(", ")}`);
  }
}

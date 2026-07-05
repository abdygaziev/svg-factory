const assetNamePattern = /^[a-z0-9][a-z0-9-]*$/;

export function validateAssetName(value, { owner = "Asset", invalidPrefix } = {}) {
  if (typeof value !== "string" || !assetNamePattern.test(value)) {
    const prefix = invalidPrefix ?? `${owner} has invalid name`;
    throw new Error(`${prefix}: use lowercase letters, numbers, and hyphens only`);
  }
  return value;
}

export function validateSheetName(value) {
  return validateAssetName(value, {
    owner: "Sheet",
    invalidPrefix: `Invalid sheet name "${value}"`
  });
}

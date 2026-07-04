export const elementKindDescriptors = deepFreeze({
  circle: {
    geometry: ["cx", "cy", "r"],
    nonNegative: ["r"]
  },
  ellipse: {
    geometry: ["cx", "cy", "rx", "ry"],
    nonNegative: ["rx", "ry"]
  },
  line: {
    geometry: ["x1", "y1", "x2", "y2"]
  },
  path: {
    geometry: ["d"],
    strings: ["d"]
  },
  polygon: {
    geometry: ["points"],
    strings: ["points"]
  },
  polyline: {
    geometry: ["points"],
    strings: ["points"]
  },
  rect: {
    geometry: ["x", "y", "width", "height", "rx", "ry"],
    required: ["x", "y", "width", "height"],
    nonNegative: ["width", "height", "rx", "ry"]
  },
  text: {
    geometry: ["x", "y"],
    required: ["x", "y", "text"],
    strings: ["text"],
    positive: ["fontSize"]
  }
});

export const supportedKinds = Object.freeze(["group", ...Object.keys(elementKindDescriptors).sort()]);

export function descriptorForKind(kind) {
  return elementKindDescriptors[kind];
}

export function geometryFieldsFor(kind) {
  return descriptorForKind(kind)?.geometry ?? [];
}

function deepFreeze(value) {
  Object.freeze(value);
  for (const child of Object.values(value)) {
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }
  return value;
}

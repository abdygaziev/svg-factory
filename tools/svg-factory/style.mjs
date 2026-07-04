export const styleContract = deepFreeze({
  sheet: {
    width: 1600,
    height: 900,
    background: "#ffffff"
  },
  palette: {
    ink: "#111111",
    muted: "#6b7280",
    cardStroke: "#e5e7eb",
    accents: {
      byzantium: "#7c3aed",
      ottomans: "#dc2626",
      venice: "#0f766e",
      castile: "#f59e0b",
      france: "#2563eb",
      ming: "#b91c1c",
      aztec: "#16a34a",
      neutral: "#111111"
    }
  },
  strokes: {
    primary: 4,
    thin: 2.5,
    accent: 6
  },
  card: {
    width: 340,
    height: 250,
    top: 112,
    radius: 20,
    strokeWidth: 2,
    shadowId: "soft-shadow"
  },
  typography: {
    family: "Inter,Arial,sans-serif",
    labelSize: 24,
    labelWeight: 750,
    smallSize: 15,
    smallWeight: 650,
    letterSpacing: 0.6
  }
});

export function accentNames(contract = styleContract) {
  return Object.keys(contract.palette.accents);
}

export function resolveAccent(accent, fallback = "neutral", contract = styleContract) {
  return contract.palette.accents[accent ?? fallback];
}

export function knownHexColors(contract = styleContract) {
  return new Set([
    contract.sheet.background,
    contract.palette.ink,
    contract.palette.muted,
    contract.palette.cardStroke,
    ...Object.values(contract.palette.accents)
  ]);
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

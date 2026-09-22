// Categorical slots (fixed order — never cycle/reassign) and sequential
// ramp, taken from the validated default palette (dataviz skill).
export const CATEGORICAL = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948"
} as const;

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  250: "#86b6ef",
  400: "#3987e5",
  450: "#2a78d6",
  500: "#256abf",
  600: "#184f95"
} as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b"
} as const;

export const CHROME = {
  surface: "#fcfcfb",
  primaryInk: "#0b0b0b",
  secondaryInk: "#52514e",
  mutedInk: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7"
} as const;

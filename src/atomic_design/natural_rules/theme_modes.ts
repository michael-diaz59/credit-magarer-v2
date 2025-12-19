export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  LIGHT_MEDIUM_CONTRAST: "light-medium-contrast",
  LIGHT_HIGH_CONTRAST: "light-high-contrast",
  DARK_MEDIUM_CONTRAST: "dark-medium-contrast",
  DARK_HIGH_CONTRAST: "dark-high-contrast",
} as const;

export type ThemeMode =
  typeof THEME_MODES[keyof typeof THEME_MODES];

export const THEME_BASE_MODES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type ThemeBaseMode =
  typeof THEME_BASE_MODES[keyof typeof THEME_BASE_MODES];

export const THEME_CONTRASTS = {
  NORMAL: "normal",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type ThemeContrast =
  typeof THEME_CONTRASTS[keyof typeof THEME_CONTRASTS];

export function resolveThemeMode(
  mode: typeof THEME_BASE_MODES[keyof typeof THEME_BASE_MODES],
  contrast: typeof THEME_CONTRASTS[keyof typeof THEME_CONTRASTS]
): ThemeMode {
  if (contrast === THEME_CONTRASTS.NORMAL) {
    return mode;
  }

  if (mode === THEME_BASE_MODES.LIGHT) {
    return contrast === THEME_CONTRASTS.HIGH
      ? THEME_MODES.LIGHT_HIGH_CONTRAST
      : THEME_MODES.LIGHT_MEDIUM_CONTRAST;
  }

  return contrast === THEME_CONTRASTS.HIGH
    ? THEME_MODES.DARK_HIGH_CONTRAST
    : THEME_MODES.DARK_MEDIUM_CONTRAST;
}

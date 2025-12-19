import colors from '../quarks/colors.json';

export const getPaletteTokens = (mode: "light" | "dark" | "light-medium-contrast" | "light-high-contrast" | "dark-medium-contrast" | "dark-high-contrast") => {
  const scheme = colors.schemes[mode];

  return {
    primary: {
      main: scheme.primary,
      contrastText: scheme.onPrimary,
      container: scheme.primaryContainer,
      onContainer: scheme.onPrimaryContainer,
    },
    secondary: {
      main: scheme.secondary,
      contrastText: scheme.onSecondary,
      container: scheme.secondaryContainer,
      onContainer: scheme.onSecondaryContainer,
    },
    tertiary: {
      main: scheme.tertiary,
      contrastText: scheme.onTertiary,
      container: scheme.tertiaryContainer,
      onContainer: scheme.onTertiaryContainer,
    },
    error: {
      main: scheme.error,
      contrastText: scheme.onError,
    },
    background: {
      default: scheme.background,
      paper: scheme.surface,
    },
    text: {
      primary: scheme.onBackground,
      secondary: scheme.onSurfaceVariant,
    },
    action: {
        hover: scheme.onSurfaceVariant + "40",     // overlay sutil (~8%)
        selected: scheme.secondaryContainer,       // resalta con un color distinto
        focus: scheme.onSurfaceVariant + "70",    // overlay más fuerte (~20%)
        active: scheme.primary,                   // acción activa clara
        disabled: scheme.onSurface + "100",        // opacidad recomendada M3 (~38%)
        disabledBackground: scheme.onSurface + "1F", // opacidad recomendada M3 (~12%)
      },
  };
};
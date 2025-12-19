import { createTheme } from "@mui/material/styles";
import { getPaletteTokens } from "../sub_atomic_particles/palette.ts";
import { typographyTokens } from "../sub_atomic_particles/typography.ts";
import type { ThemeMode } from "./theme_modes.ts";


export function getTheme(mode: ThemeMode) {

  return createTheme({

    palette: getPaletteTokens(mode),

    typography: typographyTokens,


  });
}
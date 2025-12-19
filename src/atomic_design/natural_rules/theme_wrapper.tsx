import { useAppSelector } from "../../store/redux/coreRedux.ts";
import { getTheme } from "./theme.ts";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useEffect, useMemo } from "react";
import { ScrollProvider } from "../../core/hooks/scrolll/scroll_provider.tsx";
import App from "../../routes/App.tsx";
import { resolveThemeMode } from "./theme_modes.ts";

export default function ThemedAppWrapper() {
  const { mode, contrast } = useAppSelector((state) => state.theme);

  const paletteMode = useMemo(
    () => resolveThemeMode(mode, contrast),
    [mode, contrast]
  );

  const theme = useMemo(() => getTheme(paletteMode), [paletteMode]);

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
    localStorage.setItem("themeContrast", contrast);
  }, [mode, contrast]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScrollProvider>
        <App />
      </ScrollProvider>
    </ThemeProvider>
  );
}

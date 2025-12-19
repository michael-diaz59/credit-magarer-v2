import { createSlice } from "@reduxjs/toolkit";
import { THEME_BASE_MODES, THEME_CONTRASTS, type ThemeBaseMode, type ThemeContrast } from "../../atomic_design/natural_rules/theme_modes";

type ThemeState = {
  mode: ThemeBaseMode;
  contrast: ThemeContrast;
};

const isValidBaseMode = (value: string | null): value is ThemeBaseMode =>
  value === THEME_BASE_MODES.LIGHT || value === THEME_BASE_MODES.DARK;

const isValidContrast = (value: string | null): value is ThemeContrast =>
  value === THEME_CONTRASTS.NORMAL ||
  value === THEME_CONTRASTS.MEDIUM ||
  value === THEME_CONTRASTS.HIGH;

// 🔹 Determina el modo inicial (light o dark)
const getInitialMode = (): ThemeBaseMode => {
  const saved = localStorage.getItem("themeMode");

  if (isValidBaseMode(saved)) return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEME_BASE_MODES.DARK
    : THEME_BASE_MODES.LIGHT;
};

const getInitialContrast = (): ThemeContrast => {
  const saved = localStorage.getItem("themeContrast");

  if (isValidContrast(saved)) return saved;

  return THEME_CONTRASTS.NORMAL;
};

const initialState: ThemeState = {
  mode: getInitialMode(),
  contrast: getInitialContrast(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem("themeMode", state.mode);
    },
    setContrast: (state, action) => {
      state.contrast = action.payload;
      localStorage.setItem("themeContrast", state.contrast);
    },
  },
});

export const { toggleTheme, setTheme, setContrast } = themeSlice.actions;
export default themeSlice.reducer;

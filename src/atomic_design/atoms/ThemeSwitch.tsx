import { Switch, useTheme, Box, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/redux/coreRedux";
import { toggleTheme } from "../../store/theme/themeSlice";

export default function ThemeSwitch() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  // Sincroniza el estado con localStorage
  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={`Cambiar a modo ${mode === "light" ? "oscuro" : "claro"}`}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {mode === "dark" ? (
          <Brightness4 sx={{ color: theme.palette.primary.main }} />
        ) : (
          <Brightness7 sx={{ color: theme.palette.secondary.main }} />
        )}

        <Switch
          checked={mode === "dark"}
          onChange={handleToggle}
          color="default"
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: theme.palette.primary.main,
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: theme.palette.secondary.main,
            },
          }}
        />
      </Box>
    </Tooltip>
  );
}
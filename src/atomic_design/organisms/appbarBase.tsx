import { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
  Typography,
  Paper,
  MenuItem,
  Drawer,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsAccessibilityIcon from "@mui/icons-material/SettingsAccessibility";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useScroll } from "../../core/hooks/scrolll/useScroll";
import { CustomSx } from "../sub_atomic_particles/Custom_sx";
import AccessibilityDialog from "../atoms/AccessibilityDialog";
import { useAppSelector } from "../../store/redux/coreRedux";
import { useNavigate } from "react-router";

export default function AppBarBase() {
  const userEmail = useAppSelector((state) => state.auth.user?.email);
  const [expandedMenu, setExpandedMenu] = useState(false);
  const [expandedAccessibility, setExpandedAccessibility] = useState(false);
  const theme = useTheme();
  const { hasScrolled, scrollDirection } = useScroll();
  const showFloatAppBar = hasScrolled && scrollDirection === "up";

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/configuration"); // ruta a donde quieres enviar al usuario
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={
          showFloatAppBar
            ? CustomSx.basic.elevation.cat3
            : hasScrolled
            ? CustomSx.basic.elevation.cat3
            : 0
        }
        sx={{
          top: showFloatAppBar ? 8 : hasScrolled ? 8 : 0,
          opacity: showFloatAppBar ? 1 : hasScrolled ? 0 : 1,
          pointerEvents: showFloatAppBar
            ? "auto"
            : hasScrolled
            ? "none"
            : "auto",
          ...((showFloatAppBar || !hasScrolled) && {
            transform: "scale(1)",
          }),

          ...((!showFloatAppBar || hasScrolled) && {
            transform: "scale(0.1)",
          }),

          height: CustomSx.header.height,
          width:
            !showFloatAppBar && hasScrolled
              ? "0%" // caso 1: flotante sin scroll → oculto
              : showFloatAppBar || hasScrolled
              ? { md: "70%", xs: "50%" } // caso 2 y 3
              : "100%", // caso 4: inicio
          left: "50%",
          transform: "translateX(-50%)",
          transition:
            "width 1s ease, max-width 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "center center",
          overflow: "hidden",
          willChange: "width, transform",
          justifyContent: "center",
          borderRadius: showFloatAppBar
            ? CustomSx.basic.borderRadius.circularBorder
            : hasScrolled
            ? CustomSx.basic.borderRadius.circularBorder
            : CustomSx.basic.borderRadius.squareBorder,
          backgroundColor: showFloatAppBar
            ? alpha(
                theme.palette.primary.main,
                CustomSx.basic.trasparent.backgroundsElements
              )
            : hasScrolled
            ? alpha(
                theme.palette.primary.main,
                CustomSx.basic.trasparent.backgroundsElements
              )
            : theme.palette.primary.main,
          backdropFilter: showFloatAppBar
            ? CustomSx.basic.backdropFilter
            : hasScrolled
            ? CustomSx.basic.backdropFilter
            : "none",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition:
              "width 1s ease, max-width 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            willChange: "width, transform",
            alignContent: "center",
            px: { xs: 2, md: 4 },
            py: 1,
          }}
        >
          {/* profile  */}
          <Box
            display="flex"
            alignItems="center"
            sx={{ cursor: "pointer", display: { xs: "none", md: "flex" } }}
            onClick={handleClick}
          >
            <IconButton color="inherit">
              <AccountCircleIcon />
            </IconButton>
            <Typography variant="body1" color="inherit" sx={{ ml: 1 }}>
              {userEmail}
            </Typography>
          </Box>

          {/* título */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Typography>credit manager</Typography>
          </Box>

          {/* Botón hamburguesa (mobile) */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton
              sx={{ color: theme.palette.primary.contrastText }}
              onClick={() => setExpandedMenu(!expandedMenu)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          <Tooltip
            title="Opciones de accesibilidad"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <IconButton
              color="inherit"
              onClick={() => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setExpandedAccessibility(true);
              }}
            >
              <SettingsAccessibilityIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{ display: { xs: "flex", md: "none" } }}
        anchor="right"
        open={expandedMenu}
        onClose={() => setExpandedMenu(false)}
      >
        <Paper
          elevation={CustomSx.basic.elevation.cat3}
          sx={{
            position: "fixed",
            mt: showFloatAppBar ? 1 : 0,
            width: "40%",
            borderTopLeftRadius: CustomSx.basic.borderRadius.squareBorder,
            borderTopRightRadius: CustomSx.basic.borderRadius.squareBorder,
            borderBottomLeftRadius:
              CustomSx.basic.borderRadius.circularBorder * 3,
            borderBottomRightRadius:
              CustomSx.basic.borderRadius.circularBorder * 3,
            backdropFilter: CustomSx.basic.backdropFilter,
            left: showFloatAppBar ? "50%" : "60%",
            transform: showFloatAppBar ? "translateX(-50%)" : "translateX(0%)",
            transition:
              "width 1s ease, max-width 1s ease, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transformOrigin: "center center",
            willChange: "width, transform",
            justifyContent: "center",

            top: showFloatAppBar
              ? CustomSx.header.heightMB
              : hasScrolled
              ? CustomSx.header.heightMB
              : CustomSx.header.heightMB,
            zIndex: 1300,
            backgroundColor: alpha(
              theme.palette.background.paper,
              CustomSx.basic.trasparent.backgroundsElements
            ),
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              alignContent: "center",
              p: 3,
            }}
            gap={1}
            role="menu"
          >
            <MenuItem>
              <Box
                display="flex"
                alignItems="center"
                sx={{ cursor: "pointer" }}
                onClick={handleClick}
              >
                <Typography
                  variant="body1"
                  color="inherit"
                  sx={{
                    ml: 1,
                    overflow: "hidden", // Oculta el texto que sobra
                    textOverflow: "ellipsis", // Muestra "..."
                    whiteSpace: "nowrap", // Evita que el texto haga wrap
                    maxWidth: "150px", // Ajusta según tu layout
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </MenuItem>

            {/* Botón de accesibilidad */}
            <MenuItem
              onClick={() => {
                setExpandedAccessibility(true);
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setExpandedAccessibility(true);
              }}
              role="menuitem" // 🔹 Mejora la semántica accesible
              tabIndex={0}
              sx={{
                mt: 0,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
                color: theme.palette.text.primary,
                borderRadius: CustomSx.basic.borderRadius.circularBorder,
                "&.active": {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                },
              }}
            >
              <IconButton color="inherit">
                <SettingsAccessibilityIcon fontSize="small" />
              </IconButton>
              Accesibilidad
            </MenuItem>
          </Box>
        </Paper>
      </Drawer>

      <AccessibilityDialog
        open={expandedAccessibility}
        onClose={() => setExpandedAccessibility(false)}
      />
    </>
  );
}

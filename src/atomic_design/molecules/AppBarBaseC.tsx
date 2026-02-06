import type { RoutNav } from "../../core/helpers/name_routes";
import { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
  Paper,
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import { useScroll } from "../../core/hooks/scrolll/useScroll";
import { CustomSx } from "../sub_atomic_particles/Custom_sx";
import { MenuNavLinkItems, NavLinkItems } from "../atoms/NavLinkItems";

export const AppBarBaseC = ({ items }: FloatingAppBarProps) => {
  const [expandedMenu, setExpandedMenu] = useState(false);
  const theme = useTheme();
  const { hasScrolled, scrollDirection } = useScroll();

  const showFloatAppBar = hasScrolled && scrollDirection === "up";

  return (
    <>
      <AppBar
        position="fixed"
        elevation={
          showFloatAppBar || hasScrolled ? CustomSx.basic.elevation.cat3 : 0
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
                CustomSx.basic.trasparent.backgroundsElements,
              )
            : hasScrolled
              ? alpha(
                  theme.palette.primary.main,
                  CustomSx.basic.trasparent.backgroundsElements,
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
            alignContent: "flex-end",
            px: { xs: 2, md: 4 },
            py: 1,
          }}
        >
          {/* Desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 2,
              alignContent: "end",
              alignItems: "end",
            }}
          >
            <NavLinkItems items={items} />
          </Box>

          {/* Mobile */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignContent: "end",
              alignItems: "end",
            }}
          >
            <IconButton
              sx={{ color: theme.palette.primary.contrastText }}
              onClick={() => setExpandedMenu(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        anchor="right"
        open={expandedMenu}
        onClose={() => setExpandedMenu(false)}
        sx={{ display: { xs: "flex", md: "none" } }}
      >
        <Paper
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
              CustomSx.basic.trasparent.backgroundsElements,
            ),
            overflow: "hidden",
          }}
        >
          <MenuNavLinkItems
            items={items}
            callback={() => setExpandedMenu(false)}
          />
        </Paper>
      </Drawer>
    </>
  );
};

export interface FloatingAppBarProps {
  items: RoutNav[];
}

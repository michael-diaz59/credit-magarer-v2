import { useState, useMemo } from "react";
import { useTheme, alpha, type SxProps } from "@mui/material";
import { useLocation } from "react-router-dom";

import { useScroll } from "../../core/hooks/scrolll/useScroll";
import { baseAppBar, nameRoutesMap } from "../../core/helpers/name_routes";

import { useAppSelector } from "../../store/redux/coreRedux";
import { CustomSx } from "../../atomic_design/sub_atomic_particles/Custom_sx";
import { FloatAppBarView } from "../../atomic_design/organisms/FloatAppBarViewProps ";

export default function FloatAppBarContainer() {
  const [expandedMenu, setExpandedMenu] = useState(false);
  const [expandedAccessibility, setExpandedAccessibility] = useState(false);

  const theme = useTheme();
  const location = useLocation();
  const { hasScrolled, scrollDirection } = useScroll();

  const userEmail = useAppSelector((state) => state.auth.user?.email);

  const showFloatAppBar = hasScrolled && scrollDirection === "up";
  const elevationAppBar: number = useMemo(
    () =>
      showFloatAppBar
        ? CustomSx.basic.elevation.cat3
        : hasScrolled
        ? CustomSx.basic.elevation.cat3
        : 0,
    [showFloatAppBar, hasScrolled]
  );
  const sxMenuItem: SxProps = useMemo(
    () => ({
      mt: 0,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 1,
      color: theme.palette.secondary.contrastText,
      borderRadius: CustomSx.basic.borderRadius.circularBorder,
      "&.active": {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
      },
    }),
    [theme]
  );

  const sxAppBar: SxProps = useMemo(
    () => ({
      top: showFloatAppBar ? 8 : hasScrolled ? 8 : 0,
      opacity: showFloatAppBar ? 1 : hasScrolled ? 0 : 1,
      pointerEvents: showFloatAppBar ? "auto" : hasScrolled ? "none" : "auto",
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
    }),
    [showFloatAppBar, hasScrolled, theme]
  );

  return (
    <FloatAppBarView
      sxAppBar={sxAppBar}
      elevationAppBar={elevationAppBar}
      sxMenuItem={sxMenuItem}
      title="blade manager"
      routeName={nameRoutesMap.get(location.pathname)}
      userEmail={userEmail ?? undefined}
      expandedMenu={expandedMenu}
      expandedAccessibility={expandedAccessibility}
      onToggleMenu={() => setExpandedMenu((v) => !v)}
      onOpenAccessibility={() => setExpandedAccessibility(true)}
      onCloseMenu={() => setExpandedMenu(false)}
      onCloseAccessibility={() => setExpandedAccessibility(false)}
      navItems={baseAppBar}
      showDesktopMenu
      showMobileTitle
    />
  );
}

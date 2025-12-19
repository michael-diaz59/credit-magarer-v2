import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  MenuItem,
  Drawer,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsAccessibilityIcon from "@mui/icons-material/SettingsAccessibility";
import { NavLinkItems, MenuNavLinkItems } from "../atoms/NavLinkItems";
import AccessibilityDialog from "../atoms/AccessibilityDialog";
import type { SxProps, Theme } from "@mui/material";
import type { RoutNav } from "../../core/helpers/name_routes";

interface FloatAppBarViewProps {
  sxAppBar: SxProps<Theme>;
  elevationAppBar: number;
  sxMenuItem?: SxProps<Theme>;
  title: string;
  routeName?: string;
  userEmail?: string;

  expandedMenu: boolean;
  expandedAccessibility: boolean;

  onToggleMenu: () => void;
  onOpenAccessibility: () => void;
  onCloseMenu: () => void;
  onCloseAccessibility: () => void;

  navItems: RoutNav[];
  showDesktopMenu: boolean;
  showMobileTitle: boolean;
}

export function FloatAppBarView({
  sxAppBar,
  elevationAppBar,
  sxMenuItem,


  title,
  routeName,
  userEmail,
  expandedMenu,
  expandedAccessibility,

  onToggleMenu,
  onOpenAccessibility,
  onCloseMenu,
  onCloseAccessibility,

  navItems,
  showDesktopMenu,
  showMobileTitle,
}: FloatAppBarViewProps) {
  return (
    <>
      <AppBar position="fixed" 
      elevation={elevationAppBar}
      sx={sxAppBar}>
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
               {/* Logo / título */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0}}>
            
            {/* solo muestra esto si useremail existe */}
            {userEmail && (
              <Typography variant="caption" sx={{ opacity: 0.8, m: 2 }}>
                {userEmail}
              </Typography>
            )}
            <Typography fontWeight={600}>{title}</Typography>
          </Box>

        {/* Menú desktop */}
          {showDesktopMenu && (
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
              <NavLinkItems items={navItems} />
            </Box>
          )}

          {/* Botón hamburguesa (mobile) */}
          {showMobileTitle && (
            <Typography sx={{ display: { xs: "flex", md: "none" } }}>
              {routeName}
            </Typography>
          )}

          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton onClick={onToggleMenu}>
              <MenuIcon />
            </IconButton>
          </Box>

          <Tooltip title="Opciones de accesibilidad">
            <IconButton onClick={onOpenAccessibility}>
              <SettingsAccessibilityIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={expandedMenu} onClose={onCloseMenu}>
        <Paper sx={{ width: "40%" }}>
          <MenuNavLinkItems
            items={navItems}
            callback={onCloseMenu}
          />

          <MenuItem onClick={onOpenAccessibility}
          role="menuitem"
          tabIndex={0}
          sx={sxMenuItem}
          >
            <SettingsAccessibilityIcon fontSize="small" />
            Accesibilidad
          </MenuItem>
        </Paper>
      </Drawer>

      <AccessibilityDialog
        open={expandedAccessibility}
        onClose={onCloseAccessibility}
      />
    </>
  );
}

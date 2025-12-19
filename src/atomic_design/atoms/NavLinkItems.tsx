import {
  Box,
  MenuItem,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { CustomSx } from "../sub_atomic_particles/Custom_sx";
import type { RoutNav } from "../../core/helpers/name_routes";

export function NavLinkItems({
  items,
  sx,
}: {
  items: RoutNav[];
  sx?: SxProps<Theme>;
}) {
  const theme = useTheme();

  return (
    <Box sx={sx}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            whiteSpace: "nowrap",
            padding: "8px 12px",
            borderRadius: "8px",
            textDecoration: "none",
            color: isActive
              ? theme.palette.primary.contrastText
              : theme.palette.secondary.contrastText,
            backgroundColor: isActive
              ? theme.palette.primary.dark
              : "transparent",
            transition: "all 0.2s ease-in-out",
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </Box>
  );
}

export function MenuNavLinkItems({
  items,
  callback,
}: {
  items: RoutNav[];
  callback: () => void;
}) {
  const theme = useTheme();
    const firstItemRef = useRef<HTMLLIElement | null>(null);
   // 👇 Enfoca el primer item cuando el menú se abre
  useEffect(() => {
    if (firstItemRef.current) {
      firstItemRef.current.focus();
    }
  }, []);

  return (
    <Box sx={{ width: "100%" }}  >
      {items.map((item) => (
        <MenuItem
          key={item.path}
          component={NavLink}
          to={item.path}
          onClick={() => callback()}
          role="menuitem" // 🔹 Mejora la semántica accesible
          tabIndex={0} // 🔹 Garantiza que pueda recibir foco con Tab
          sx={{
            display: "block",
            width: "100%",
            textAlign: "center",
            color: theme.palette.text.primary,
            alignContent: "center",
            alignItems: "center",
            borderRadius: CustomSx.basic.borderRadius.circularBorder,
            "&.active": {
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
            },
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </Box>
  );
}

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface RoleCardButtonProps {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

export const CardButton = ({
  label,
  onClick,
  icon,
}: RoleCardButtonProps) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: "pointer",
        minWidth: 260,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 3,
        boxShadow: 4,
        backgroundColor: "background.paper",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: 8,
        },
      }}
    >
      {icon}
      <Typography variant="h6" fontWeight={600}>
        {label}
      </Typography>
    </Box>
  );
};

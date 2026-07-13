import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

export const AdminDashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography variant="h4" color="text.primary">
        Administración
      </Typography>
    </Box>
  );
};

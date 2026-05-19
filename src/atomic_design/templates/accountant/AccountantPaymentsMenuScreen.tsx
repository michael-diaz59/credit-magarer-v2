import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, ButtonBase, useTheme, IconButton, Stack } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BadgeIcon from '@mui/icons-material/Badge';
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { CustomSx } from "../../sub_atomic_particles/Custom_sx";

export const AccountantPaymentsMenuScreen: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Otros Pagos",
      icon: (
        <PaymentsIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.anotherPayments,
    },
    {
      label: "Nómina",
      icon: (
        <BadgeIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.rosterUsers,
    },
    {
      label: "Impuestos",
      icon: (
        <MonetizationOnIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.taxtPayments,
    },
    {
      label: "Financiamientos",
      icon: (
        <AccountBalanceIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.financialDebts,
    },
  ];

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', maxWidth: 800, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} color="primary">
          <ArrowBackIcon fontSize="large" />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Gestión de Pagos
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 4,
          maxWidth: 800,
          width: "100%",
        }}
      >
        {menuItems.map((item) => (
          <ButtonBase
            key={item.label}
            onClick={() => navigate(item.path)}
            sx={{
              width: { xs: "100%", sm: "45%" },
              height: 150,
              backgroundColor: theme.palette.primary.main,
              borderRadius: CustomSx.basic.borderRadius.circularBorder,
              boxShadow: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 2,
              padding: 3,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: 6,
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            {item.icon}
            <Typography
              variant="h5"
              fontWeight={600}
              color={theme.palette.primary.contrastText}
            >
              {item.label}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
};

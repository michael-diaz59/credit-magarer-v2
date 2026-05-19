import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, ButtonBase, useTheme } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { CustomSx } from "../../sub_atomic_particles/Custom_sx";
import { ScreenPaths } from "../../../core/helpers/name_routes";

export const AccountantDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const buttons = [
    {
      label: "Cuadrar movimientos",
      icon: (
        <MonetizationOnIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.dailyOperations,
    },
    {
      label: "Confirmar entrega de crédito",
      icon: (
        <MonetizationOnIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.pendingDelivery,
    },
    {
      label: "lista de creditos",
      icon: (
        <AccountBalanceIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.debits,
    },
    {
      label: "Balances por Ruta",
      icon: (
        <AccountBalanceIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.routesBalance,
    },
    {
      label: "Informe Financiero",
      icon: (
        <AccountBalanceIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: ScreenPaths.accountant.financialReports,
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
      <Typography variant="h4" mb={4} fontWeight="bold" color="primary">
        Dashboard de Contabilidad
      </Typography>
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
        {buttons.map((btn) => (
          <ButtonBase
            key={btn.label}
            onClick={() => navigate(btn.path)}
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
            {btn.icon}
            <Typography
              variant="h5"
              fontWeight={600}
              color={theme.palette.primary.contrastText}
            >
              {btn.label}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
};

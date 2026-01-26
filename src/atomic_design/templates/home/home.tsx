import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, ButtonBase, useTheme } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import GavelIcon from "@mui/icons-material/Gavel";
import PeopleIcon from "@mui/icons-material/People";
import { getAuth, signOut } from "firebase/auth";
import { CustomSx } from "../../sub_atomic_particles/Custom_sx";
import { ScreenPaths } from "../../../core/helpers/name_routes";

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = getAuth();

  const buttons = [
    {
      label: "Ventas",
      icon: (
        <MonetizationOnIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path:ScreenPaths.advisor.home,
    },
    {
      label: "Contabilidad",
      icon: (
        <AccountBalanceIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: "/accounting",
    },
    {
      label: "Auditoría",
      icon: (
        <GavelIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: "/audit",
    },
    {
      label: "Cobradores",
      icon: (
        <PeopleIcon
          fontSize="large"
          sx={{ color: theme.palette.primary.contrastText }}
        />
      ),
      path: "/Debt_collectors",
    },
  ];

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
            onClick={() => {
              if (btn.label === "Contabilidad") {
                signOut(auth)
                  .then(() => {
                    // Sign-out successful.
                  })
                  .catch(() => {
                    // An error happened.
                  });
              }
              navigate(btn.path);
            }}
            sx={{
              width: { xs: "100%", sm: "45%" }, // responsive: full width en mobile, ~2 por fila en desktop
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

export default Dashboard;

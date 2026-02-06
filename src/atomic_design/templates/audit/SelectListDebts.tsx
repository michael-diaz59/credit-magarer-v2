import { Box, Stack, Typography } from "@mui/material";
import { CardButton } from "../../atoms/CardButton";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { useNavigate } from "react-router";

export const SelectListDebts = () => {
  const navigate = useNavigate();

  const goToFiltersDebts = () => {
    navigate(ScreenPaths.auditor.debitsS);
  };

  const goToDebtsByCustomers = () => {
    navigate(ScreenPaths.auditor.debitsC);
  };

  return (
    <>
      {/* 🔔 Dialogo de permisos */}

      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Stack spacing={4} alignItems="center">
          <Typography variant="h4" fontWeight={700}>
           elige como quieres buscar los prestamos
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={4}>

            <CardButton
              label="buscar deuda por filtros"
              onClick={goToFiltersDebts}
            />
            <CardButton
              label="buscar deudas por clientes"
              onClick={goToDebtsByCustomers}
            />
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

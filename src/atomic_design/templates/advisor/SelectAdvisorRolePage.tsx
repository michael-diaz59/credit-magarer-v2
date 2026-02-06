import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { BaseDialog } from "../../atoms/BaseDialog";
import type { Role } from "../../../features/users/domain/business/entities/User";
import { CardButton } from "../../atoms/CardButton";
import { ScreenPaths } from "../../../core/helpers/name_routes";

export const SelectAdvisorRolePage = () => {
  const navigate = useNavigate();
  const roles: Role[] | undefined = useAppSelector(
    (state) => state.user.user?.roles
  );
   const aut= useAppSelector(
    (state) => state.auth.user
  );
  console.log(aut)

  const [dialogOpen, setDialogOpen] = useState(false);

  const showPermissionError = () => {
    setDialogOpen(true);
  };

  const handleOfficeAdvisor = () => {
    console.log("ProtectedOfficeAdvisor");
    console.log(roles);

    // No autenticado o sin roles
    if (!roles) {
      showPermissionError();
      return;
    }

    // Tiene permiso
    if (roles.includes("OFFICE_ADVISOR") || roles.includes("ADMIN")) {
      navigate(ScreenPaths.advisor.office.home);
      return;
    }

    // No tiene permiso
    showPermissionError();
  };

  const handleFieldAdvisor = () => {
    console.log("ProtectedFieldAdvisor");
    console.log(roles);

    // No autenticado o sin roles
    if (!roles) {
      showPermissionError();
      return;
    }

    // Tiene permiso
    if (roles.includes("FIELD_ADVISOR") || roles.includes("ADMIN")) {
      navigate(ScreenPaths.advisor.field.visit.visits);
      return;
    }

    // No tiene permiso
    showPermissionError();
  };

  return (
    <>
      {/* 🔔 Dialogo de permisos */}
      <BaseDialog
        open={dialogOpen}
        title="Acceso denegado"
        body="No tienes los permisos requeridos para este segmento"
        butonText="Aceptar"
        onClick={() => setDialogOpen(false)}
      />

      <Box
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Stack spacing={4} alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            Selecciona tu tipo de asesor
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
            <CardButton
              label="Asesor de campo"
              onClick={handleFieldAdvisor}
            />

            <CardButton
              label="Asesor de oficina"
              onClick={handleOfficeAdvisor}
            />
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

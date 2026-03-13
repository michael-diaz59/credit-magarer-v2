import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import { useNavigate } from "react-router";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import AuthOrchestrator from "../../../features/userAuthentication/domain/infraestructure/AuthOrchestrator";
import { AccountBalanceWallet, Map as MapIcon } from "@mui/icons-material";

export const ProfileScreen = () => {
  const user = useAppSelector((state) => state.user.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!user) {
    return <Typography>Cargando perfil...</Typography>;
  }

  const isAdmin = user.roles.includes("ADMIN");
  const isCollector = user.roles.includes("COLLECTOR");

  const handleLogout = async () => {
    try {
      // Assuming companyId is defined elsewhere or not needed for this specific logout
      // if (companyId) {
      //   // Aquí deberías colocar la lógica real para cerrar el turno por id.
      //   // Simularemos un error de permisos por defecto si no es admin,
      //   // aunque ahora todos pueden cerrar si la UI lo permite, o según la BD.
      // }
      const authOrchestrator = new AuthOrchestrator(dispatch);
      const response = await authOrchestrator.logOut?.(); // Changed to logOut?() to match original intent

      if (response.ok) {
        navigate(ScreenPaths.log.logIn); // Changed to ScreenPaths.log.logIn to match original intent
        dispatch({ type: "RESET_APP" });
        return;
      }

      alert("Error cerrando sesión, permisos denegados."); // Changed message to reflect logout
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box
      p={2}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
      }}
    >
      <Typography variant="h5">Mi perfil</Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <ProfileItem label="Nombre" value={user.name} />
            <ProfileItem label="Correo" value={user.email} />
            <ProfileItem label="Roles" value={user.roles.join(", ")} />

            {isCollector && (
              <>
                <Divider />
                <ProfileItem
                  label="Dinero recolectado"
                  value={`$ ${user.totalAmount?.toLocaleString() ?? "0"}`}
                  highlight
                />
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {isAdmin && (
        <Box mt={2} mb={2}>
           <Stack spacing={2}>
             <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover'} }} onClick={() => navigate('/configuration/routes')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, padding: '16px !important' }}>
                   <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: 1, display: 'flex' }}>
                      <MapIcon sx={{ color: 'primary.contrastText' }} />
                   </Box>
                   <Box>
                      <Typography variant="h6">Administrar Rutas</Typography>
                      <Typography variant="body2" color="text.secondary">
                         Agrega, edita y asocia cobradores a rutas específicas.
                      </Typography>
                   </Box>
                </CardContent>
             </Card>

             <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover'} }} onClick={() => navigate('/configuration/bank-accounts')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, padding: '16px !important' }}>
                   <Box sx={{ bgcolor: 'secondary.light', p: 1, borderRadius: 1, display: 'flex' }}>
                      <AccountBalanceWallet sx={{ color: 'secondary.contrastText' }} />
                   </Box>
                   <Box>
                      <Typography variant="h6">Administrar Cuentas Bancarias</Typography>
                      <Typography variant="body2" color="text.secondary">
                         Controla las cuentas, bancos, tipos y límites de caja operacionales.
                      </Typography>
                   </Box>
                </CardContent>
             </Card>
           </Stack>
        </Box>
      )}

      {/* Spacer */}
      <Box flex={1} />

      {/* Logout */}
      <Button
        variant="contained"
        color="error"
        fullWidth
        size="large"
        onClick={handleLogout}
        sx={{ mt: 2 }}
      >
        Cerrar sesión
      </Button>

    </Box>
  );
};

const ProfileItem = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant={highlight ? "h6" : "body1"}
      fontWeight={highlight ? 600 : 400}
    >
      {value}
    </Typography>
  </Box>
);

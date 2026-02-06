import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import { useNavigate } from "react-router";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import AuthOrchestrator from "../../../features/userAuthentication/domain/infraestructure/AuthOrchestrator";

export const ProfileScreen = () => {
  const user = useAppSelector((state) => state.user.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!user) {
    return <Typography>Cargando perfil...</Typography>;
  }

  const isCollector = user.roles.includes("COLLECTOR");

  const handleLogout = async () => {
    try {
      const authOrchestrator = new AuthOrchestrator(dispatch);
      const result=await authOrchestrator.logOut?.(); // ⬅️ te explico esto abajo
      if(result.ok){
      navigate(ScreenPaths.log.logIn);
      }else{
        console.log(result.error.code)
      }
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }
  };

  return (
    <Box p={2} height="100dvh" display="flex" flexDirection="column">
      <Typography variant="h5" mb={2}>
        Mi perfil
      </Typography>

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

      {/* Spacer */}
      <Box flex={1} />

      {/* Logout */}
      <Button
        variant="contained"
        color="error"
        fullWidth
        size="large"
        onClick={handleLogout}
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
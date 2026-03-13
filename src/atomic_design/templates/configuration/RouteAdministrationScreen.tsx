import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Fab,
  Stack,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppSelector, type RootState } from "../../../store/redux/coreRedux";
import { routeOrchestrator } from "../../../features/routes/domain/infraestructure/RouteOrchestrator";
import type { Route } from "../../../features/routes/domain/business/entities/Route";

export const RouteAdministrationScreen = () => {
  const navigate = useNavigate();
  const companyId = useAppSelector((state: RootState) => state.user.user?.companyId);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const result = await routeOrchestrator.getRoutesUseCase.execute({ companyId });
    if (result.ok) {
      setRoutes(result.value);
    } else {
      console.error("Error al obtener rutas", result.error);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    let active = true;
    if (active) fetchRoutes();
    return () => { active = false; };
  }, [fetchRoutes]);

  const handleRouteClick = (routeId: string) => {
    navigate(`/configuration/routes/edit/${routeId}`);
  };

  const handleCreateRoute = () => {
    navigate('/configuration/routes/create');
  };

  return (
    <Box p={2} sx={{ minHeight: "100vh", position: "relative" }}>
      <Typography variant="h5" mb={2}>
        Administración de Rutas
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {routes.length === 0 ? (
             <Typography variant="body1" color="text.secondary" align="center" mt={4}>
               No hay rutas creadas en la compañía.
             </Typography>
          ) : (
            routes.map((route) => (
              <Card 
                key={route.id} 
                variant="outlined" 
                onClick={() => handleRouteClick(route.id)}
                sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
              >
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {route.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {route.description}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleCreateRoute}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

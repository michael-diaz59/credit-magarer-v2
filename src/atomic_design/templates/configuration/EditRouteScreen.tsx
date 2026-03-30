import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Box, Button, Stack, TextField, Typography, CircularProgress, 
  Select, MenuItem, InputLabel, FormControl 
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector, type RootState } from "../../../store/redux/coreRedux";
import { routeOrchestrator } from "../../../features/routes/domain/infraestructure/RouteOrchestrator";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Route } from "../../../features/routes/domain/business/entities/Route";
import type { User } from "../../../features/users/domain/business/entities/User";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import DebtTable from "../../molecules/DebtTable";
import { ScreenPaths } from "../../../core/helpers/name_routes";

export const EditRouteScreen = () => {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();
  const companyId = useAppSelector((state: RootState) => state.user.user?.companyId);
  const dispatch = useAppDispatch();

  const [route, setRoute] = useState<Route | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCobrador, setSelectedCobrador] = useState<string>("");
  const [allCompanyUsers, setAllCompanyUsers] = useState<User[]>([]);
  const [savingCobrador, setSavingCobrador] = useState(false);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loadingDebts, setLoadingDebts] = useState(false);

  const userOrchestrator = useMemo(() => new UserOrchestrator(dispatch), [dispatch]);

  const fetchRouteAndUsers = useCallback(async () => {
    if (!companyId || !routeId) return;
    setLoading(true);
    
    // Fetch route
    const result = await routeOrchestrator.getRoutesUseCase.execute({ companyId });
    if (result.ok) {
      const foundRoute = result.value.find((r: Route) => r.id === routeId);
      if (foundRoute) {
        setRoute(foundRoute);
        setName(foundRoute.name);
        setDescription(foundRoute.description);
        setSelectedCobrador(foundRoute.cobradorId || "");
      } else {
        alert("Ruta no encontrada");
        navigate(-1);
      }
    }

    // Fetch all users
    const resultUsers = await userOrchestrator.getUsersByCompany({ id: companyId });
    if (resultUsers.state.ok) {
      setAllCompanyUsers(resultUsers.state.value);
    }

    // Fetch debts for this route
    setLoadingDebts(true);
    const debtOrchestrator = new DebtOrchestrator();
    const resultDebts = await debtOrchestrator.getDebtsByRoute({ companyId, routeId });
    if (resultDebts.ok) {
      setDebts(resultDebts.value);
    }
    setLoadingDebts(false);

    setLoading(false);
  }, [companyId, routeId, navigate, userOrchestrator]);

  useEffect(() => {
    let active = true;
    if (active) fetchRouteAndUsers();
    return () => { active = false; };
  }, [fetchRouteAndUsers]);

  const handleSaveRoute = async () => {
    if (!companyId || !route || !name.trim()) return;
    setSaving(true);

    const updatedRoute: Route = {
      ...route,
      name: name.trim(),
      description: description.trim(),
    };

    const result = await routeOrchestrator.updateRouteUseCase.execute({ route: updatedRoute });

    setSaving(false);
    if (result.ok) {
      setRoute(updatedRoute);
      alert("Ruta actualizada exitosamente");
    } else {
      alert("Error al actualizar la ruta");
    }
  };

  const handleChangeCobrador = async () => {
    if (!companyId || !route) return;
    setSavingCobrador(true);

    const result = await routeOrchestrator.assignRouteCollectorUseCase.execute({
      route,
      newCobradorId: selectedCobrador || undefined,
      oldCobradorId: route.cobradorId,
      companyId
    });

    if (result.ok) {
      alert("Cobrador modificado exitosamente");
      // Update local route state
      setRoute({ ...route, cobradorId: selectedCobrador || undefined });
    } else {
      alert("Error al cambiar cobrador");
    }
    setSavingCobrador(false);
  };

  if (loading) {
     return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  }

  return (
    <Box p={2} sx={{ minHeight: "100vh" }}>
      <Typography variant="h5" mb={2}>
        Editar Ruta
      </Typography>

      <Stack spacing={3} mt={2}>
        <TextField
          label="Nombre de la ruta"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <TextField
          label="Descripción"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Box display="flex" gap={2} mt={2}>
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Volver
          </Button>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleSaveRoute}
            disabled={!name.trim() || saving || (name === route?.name && description === route?.description)}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Box>
      </Stack>

      <Box mt={4}>
         <Typography variant="h6" mb={2}>Asignación de Cobrador</Typography>
         <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <FormControl fullWidth>
              <InputLabel id="select-user-label">Cobrador Asignado</InputLabel>
              <Select
                 labelId="select-user-label"
                 value={selectedCobrador}
                 label="Cobrador Asignado"
                 onChange={(e) => setSelectedCobrador(e.target.value)}
              >
                 <MenuItem value=""><em>Ninguno</em></MenuItem>
                 {allCompanyUsers.map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                 ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleChangeCobrador}
              disabled={savingCobrador || selectedCobrador === (route?.cobradorId || "")}
              sx={{ minWidth: 180, py: { xs: 1.5, sm: undefined } }}
            >
              {savingCobrador ? "Cambiando..." : "Cambiar cobrador"}
            </Button>
         </Stack>
      </Box>

      <Box mt={6} mb={4}>
        <Typography variant="h6" mb={2}>Deudas en esta Ruta</Typography>
        {loadingDebts ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={30} />
          </Box>
        ) : debts.length > 0 ? (
          <DebtTable 
            debts={debts} 
            onClick={(d) => navigate(ScreenPaths.auditor.debit(d.id))} 
          />
        ) : (
          <Typography variant="body1" color="text.secondary" fontStyle="italic">
            No hay deudas asignadas a esta ruta.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

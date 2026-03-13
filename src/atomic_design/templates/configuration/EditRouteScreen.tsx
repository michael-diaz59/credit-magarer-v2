import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Box, Button, Stack, TextField, Typography, CircularProgress, 
  Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Select, MenuItem, InputLabel, FormControl 
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector, type RootState } from "../../../store/redux/coreRedux";
import { routeOrchestrator } from "../../../features/routes/domain/infraestructure/RouteOrchestrator";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import type { Route } from "../../../features/routes/domain/business/entities/Route";
import type { User } from "../../../features/users/domain/business/entities/User";
import { Delete } from "@mui/icons-material";

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

  // Users in route state
  const [usersInRoute, setUsersInRoute] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  // Add user dialog state
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [allCompanyUsers, setAllCompanyUsers] = useState<User[]>([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>("");

  const userOrchestrator = useMemo(() => new UserOrchestrator(dispatch), [dispatch]);

  const fetchRouteAndUsers = useCallback(async () => {
    if (!companyId || !routeId) return;
    setLoading(true);
    
    // First we get all routes to find ours (since there is no getRouteById UC right now, and finding locally is fast)
    const result = await routeOrchestrator.getRoutesUseCase.execute({ companyId });
    if (result.ok) {
      const foundRoute = result.value.find((r: Route) => r.id === routeId);
      if (foundRoute) {
        setRoute(foundRoute);
        setName(foundRoute.name);
        setDescription(foundRoute.description);
      } else {
        alert("Ruta no encontrada");
        navigate(-1);
      }
    }

    setLoading(false);
  }, [companyId, routeId, navigate]);

  useEffect(() => {
    let active = true;
    if (active) fetchRouteAndUsers();
    return () => { active = false; };
  }, [fetchRouteAndUsers]);

  const loadUsersInRoute = async () => {
    if (!companyId || !routeId) return;
    setLoadingUsers(true);
    setShowUsers(true);
    const result = await userOrchestrator.getUsersByRoute({ companyId, routeId });
    if (result.state.ok) {
      setUsersInRoute(result.state.value);
    }
    setLoadingUsers(false);
  };

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
      alert("Ruta actualizada exitosamente");
    } else {
      alert("Error al actualizar la ruta");
    }
  };

  const handleOpenAddUser = async () => {
    if (!companyId) return;
    // Load all users to show in dropdown
    const result = await userOrchestrator.getUsersByCompany({ id: companyId });
    if (result.state.ok) {
      setAllCompanyUsers(result.state.value);
      setSelectedUserIdToAdd("");
      setOpenAddUserDialog(true);
    } else {
      alert("Error al cargar usuarios de la compañía");
    }
  };

  const confirmAddUser = async () => {
    if (!companyId || !routeId || !selectedUserIdToAdd) return;
    const userToAdd = allCompanyUsers.find(u => u.id === selectedUserIdToAdd);
    if (!userToAdd) return;

    // Concat routeId to user's idRoutes
    const newRoutes = [...(userToAdd.idRoutes || []), routeId];
    // Remove duplicates just in case
    const uniqueRoutes = Array.from(new Set(newRoutes));

    const result = await userOrchestrator.updateUserRoute({
      userId: userToAdd.id,
      companyId: companyId,
      idRoutes: uniqueRoutes
    });

    if (result.ok) {
      setOpenAddUserDialog(false);
      loadUsersInRoute(); // reload list
    } else {
      alert("Error al añadir usuario a la ruta");
    }
  };

  const handleRemoveUserFromRoute = async (user: User) => {
    if (!companyId || !routeId) return;
    const confirmed = window.confirm(`¿Estás seguro que deseas quitar a ${user.name} de esta ruta?`);
    if (!confirmed) return;

    // Filter out this routeId from user's idRoutes
    const updatedRoutes = (user.idRoutes || []).filter((id: string) => id !== routeId);

    const result = await userOrchestrator.updateUserRoute({
      userId: user.id,
      companyId: companyId,
      idRoutes: updatedRoutes
    });

    if (result.ok) {
        // remove from local state to reflect UI instantly
        setUsersInRoute(prev => prev.filter(u => u.id !== user.id));
    } else {
        alert("Error al remover usuario de la ruta");
    }
  };

  if (loading) {
     return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  }

  // Filtrar los usuarios que ya están en la ruta para no mostrarlos en el Select
  const availableUsersToAdd = allCompanyUsers.filter(u => !u.idRoutes?.includes(routeId || ""));

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
         {!showUsers ? (
            <Button variant="outlined" color="secondary" fullWidth onClick={loadUsersInRoute}>
               Ver Usuarios de la Ruta
            </Button>
         ) : (
            <Box>
               <Typography variant="h6" mb={2}>Usuarios asignados</Typography>
               
               {loadingUsers ? <CircularProgress size={24} /> : (
                 <Stack spacing={1} mb={2}>
                   {usersInRoute.length === 0 ? (
                       <Typography variant="body2" color="text.secondary">No hay usuarios asignados a esta ruta.</Typography>
                   ) : (
                       usersInRoute.map(user => (
                         <Card key={user.id} variant="outlined">
                           <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                             <Box>
                               <Typography variant="subtitle2" fontWeight="bold">{user.name}</Typography>
                               <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                             </Box>
                             <IconButton color="error" size="small" onClick={() => handleRemoveUserFromRoute(user)}>
                               <Delete fontSize="small" />
                             </IconButton>
                           </CardContent>
                         </Card>
                       ))
                   )}
                 </Stack>
               )}

               <Button variant="contained" color="secondary" fullWidth onClick={handleOpenAddUser}>
                 Añadir Usuario a Ruta
               </Button>
            </Box>
         )}
      </Box>

      {/* Dialog for adding user */}
      <Dialog open={openAddUserDialog} onClose={() => setOpenAddUserDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Añadir Usuario a la Ruta</DialogTitle>
        <DialogContent>
           <FormControl fullWidth sx={{ mt: 1 }}>
             <InputLabel id="select-user-label">Seleccionar Usuario</InputLabel>
             <Select
                labelId="select-user-label"
                value={selectedUserIdToAdd}
                label="Seleccionar Usuario"
                onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
             >
                {availableUsersToAdd.length === 0 && (
                   <MenuItem disabled value="">No hay más usuarios disponibles en la compañía</MenuItem>
                )}
                {availableUsersToAdd.map(u => (
                   <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
                ))}
             </Select>
           </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddUserDialog(false)}>Cancelar</Button>
          <Button onClick={confirmAddUser} variant="contained" disabled={!selectedUserIdToAdd}>
            Añadir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

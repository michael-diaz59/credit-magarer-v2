import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface RouteManagementDialogProps {
  open: boolean;
  onClose: () => void;
  routes: Record<string, string[]>; // routeName -> customerIds
  allCustomers: { id: string; name: string }[];
  onAddRoute: (name: string) => void;
  onDeleteRoute: (name: string) => void;
  onAssignCustomer: (customerId: string, routeName: string) => void;
  onUnassignCustomer: (customerId: string, routeName: string) => void;
}

export const RouteManagementDialog = ({
  open,
  onClose,
  routes,
  allCustomers,
  onAddRoute,
  onDeleteRoute,
  onAssignCustomer,
  onUnassignCustomer,
}: RouteManagementDialogProps) => {
  const [newRouteName, setNewRouteName] = useState("");

  /* =========================
     Rutas disponibles
  ========================= */

  const routeNames = Object.keys(routes);

  const handleCreate = () => {
    const name = newRouteName.trim();
    if (!name) return;

    onAddRoute(name);
    setNewRouteName("");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Gestionar Rutas de Cobro</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={4}>
          {/* Crear Ruta */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Crear Nueva Ruta
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Nombre de la ruta"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={!newRouteName.trim()}
              >
                Crear
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Listado de rutas */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Rutas Existentes
            </Typography>

            {routeNames.length === 0 ? (
              <Typography color="text.secondary">
                No tienes rutas creadas.
              </Typography>
            ) : (
              <List
                dense
                sx={{
                  maxHeight: 300,
                  overflow: "auto",
                  bgcolor: "background.paper",
                }}
              >
                {routeNames.map((routeName) => {
                  const customersInRoute = routes[routeName] ?? [];

                  return (
                    <ListItem
                      key={routeName}
                      sx={{
                        border: "1px solid #eee",
                        mb: 1,
                        borderRadius: 1,
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => onDeleteRoute(routeName)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {routeName}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mb={1}
                        >
                          {customersInRoute.length} clientes asignados
                        </Typography>

                        {/* Clientes asignados */}
                        {customersInRoute.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                            {customersInRoute.map((customerId) => {
                              const customerName =
                                allCustomers.find((c) => c.id === customerId)
                                  ?.name ?? customerId;

                              return (
                                <Chip
                                  key={customerId}
                                  label={customerName}
                                  size="small"
                                  onDelete={() =>
                                    onUnassignCustomer(customerId, routeName)
                                  }
                                />
                              );
                            })}
                          </Box>
                        )}

                        {/* Asignar cliente */}
                        <Select
                          displayEmpty
                          size="small"
                          value=""
                          onChange={(e) => {
                            const value = e.target.value as string;
                            if (value) {
                              onAssignCustomer(value, routeName);
                            }
                          }}
                          sx={{ width: 220, fontSize: "0.8rem" }}
                          renderValue={() => "Asignar cliente..."}
                        >
                          <MenuItem value="" disabled>
                            Seleccionar cliente
                          </MenuItem>

                          {allCustomers
                            .filter((c) => !customersInRoute.includes(c.id))
                            .map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                {c.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

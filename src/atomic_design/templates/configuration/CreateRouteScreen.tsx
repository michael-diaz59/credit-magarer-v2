import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector, type RootState } from "../../../store/redux/coreRedux";
import { routeOrchestrator } from "../../../features/routes/domain/infraestructure/RouteOrchestrator";

export const CreateRouteScreen = () => {
  const navigate = useNavigate();
  const companyId = useAppSelector((state: RootState) => state.user.user?.companyId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!companyId || !name.trim()) return;
    setLoading(true);

    const newRoute = {
      id: "", // El repositorio generará uno si está vacío
      name: name.trim(),
      description: description.trim(),
      companyId,
    };

    const result = await routeOrchestrator.createRouteUseCase.execute({ route: newRoute });

    setLoading(false);
    if (result.ok) {
      navigate(-1);
    } else {
      alert("Error al crear la ruta");
    }
  };

  return (
    <Box p={2} sx={{ minHeight: "100vh" }}>
      <Typography variant="h5" mb={2}>
        Crear Nueva Ruta
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
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? "Creando..." : "Crear Ruta"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

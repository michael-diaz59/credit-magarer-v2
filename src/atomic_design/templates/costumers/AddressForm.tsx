import { Grid, TextField, Box, Typography, Button } from "@mui/material";
import {
  type Control,
  Controller,
  type Path,
  useFormContext,
} from "react-hook-form";
import type { CostumerFormValues } from "./SchemasCostumer";
import { get } from "react-hook-form";
import { textFieldSX } from "../../atoms/textFieldSX";
import { useWatch } from "react-hook-form";
import { extractCoordinates } from "../../sub_atomic_particles/extractCoordinates";

interface Props {
  control: Control<CostumerFormValues>;
  prefix: Path<CostumerFormValues>;
}

export const AddressForm = ({ control, prefix }: Props) => {
  const {
    formState: { errors },
    setValue,
  } = useFormContext<CostumerFormValues>();

  const splitCoordinates = (coords: string) => {
    const [lat, lng] = coords.split(",");

    return {
      latitud: Number(lat),
      longitud: Number(lng),
    };
  };

  const name = (field: string) =>
    `${prefix}.${field}` as Path<CostumerFormValues>;

  const coordenadas = useWatch({
    control,
    name: name("location.coordenadas"),
  });

  const hasValidCoordinates =
    typeof coordenadas === "string" &&
    /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(coordenadas.trim());

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${coordenadas}`;
    window.open(url, "_blank");
  };
  // Errores de la sección (address)
  const sectionErrors = get(errors, prefix) as
    | Record<string, unknown>
    | undefined;

  const hasSectionErrors =
    sectionErrors && Object.keys(sectionErrors).length > 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Dirección
      </Typography>

      {hasSectionErrors && (
        <Typography color="error" sx={{ mb: 2 }}>
          Corrige los errores de la dirección
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid>
          <Controller
            name={name("address")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Dirección"
                fullWidth
                sx={textFieldSX}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("neighborhood")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Barrio"
                fullWidth
                sx={textFieldSX}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("stratum")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Estrato"
                fullWidth
                error={!!fieldState.error}
                sx={textFieldSX}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("city")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Ciudad"
                fullWidth
                error={!!fieldState.error}
                sx={textFieldSX}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid>
          <Controller
            name={name("location.coordenadas")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Coordenadas"
                fullWidth
                error={!!fieldState.error}
                sx={textFieldSX}
                helperText={
                  fieldState.error?.message
                }
                onChange={(e) => {
                  const value = e.target.value;

                  const parsed = extractCoordinates(value);

                  if (parsed) {
                    const { latitud, longitud } = splitCoordinates(parsed);

                    // campo visible
                    field.onChange(parsed);

                    // campos derivados automáticos
                    setValue(name("location.latitud"), latitud, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    setValue(name("location.longitud"), longitud, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  } else {
                    field.onChange(value);

                    // limpiar si deja de ser válido
                    setValue(name("location.latitud"), undefined);
                    setValue(name("location.longitud"), undefined);
                  }
                }}
              />
            )}
          />
        </Grid>
        {hasValidCoordinates && (
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={openInMaps}>
              Abrir en mapa
            </Button>
          </Box>
        )}
      </Grid>
    </Box>
  );
};

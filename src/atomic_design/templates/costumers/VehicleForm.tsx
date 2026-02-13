import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import {
  type Control,
  Controller,
  type Path,
  useFormContext,
} from "react-hook-form";
import type { CostumerFormValues } from "./SchemasCostumer";
import { get } from "react-hook-form";
import { textFieldSX } from "../../atoms/textFieldSX";

interface Props {
  control: Control<CostumerFormValues>;
  index: number;
}

export const VehicleForm = ({ control, index }: Props) => {
  const {
    formState: { errors },
  } = useFormContext<CostumerFormValues>();

  const basePath = `vehicle.${index}` as Path<CostumerFormValues>;

  const name = (field: string) =>
    `${basePath}.${field}` as Path<CostumerFormValues>;

  // Errores de la sección vehículo completa
  const sectionErrors = get(errors, basePath) as Record<string, unknown> | undefined;

  const hasSectionErrors =
    sectionErrors && Object.keys(sectionErrors).length > 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Vehículo #{index + 1}
      </Typography>

      {hasSectionErrors && (
        <Typography color="error" sx={{ mb: 2 }}>
          Corrige los errores de este vehículo
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid>
          <Controller
            name={name("vehicleClass")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Clase"
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
            name={name("brand")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Marca"
                    sx={textFieldSX}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("model")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                  sx={textFieldSX}
                {...field}
                label="Modelo"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("commercialValue")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Valor comercial"
                    sx={textFieldSX}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) =>
                  field.onChange(Number(e.target.value))
                }
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("serviceType")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                select
                {...field}
                label="Tipo de servicio"
                fullWidth
                    sx={textFieldSX}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                <MenuItem value="PUBLICO">Público</MenuItem>
                <MenuItem value="PARTICULAR">Particular</MenuItem>
              </TextField>
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("pledged")}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!field.value}
                    onChange={(e) =>
                      field.onChange(e.target.checked)
                    }
                  />
                }
                label="pignorado"
              />
            )}
          />
          {/*
            Checkbox no usa helperText,
            pero si necesitas mostrar error:
          */}
          {/*
          fieldState.error && (
            <Typography color="error" variant="caption">
              {fieldState.error.message}
            </Typography>
          )
          */}
        </Grid>
      </Grid>
    </Box>
  );
};

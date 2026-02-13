import {
  Grid,
  TextField,
  Box,
  MenuItem,
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
  prefix: Path<CostumerFormValues>;
}

export const HousingForm = ({ control, prefix }: Props) => {
  const {
    formState: { errors },
  } = useFormContext<CostumerFormValues>();

  const name = (field: string) =>
    `${prefix}.${field}` as Path<CostumerFormValues>;

  // Errores de la sección vivienda
  const sectionErrors = get(errors, prefix) as Record<string, unknown> | undefined;

  const hasSectionErrors =
    sectionErrors && Object.keys(sectionErrors).length > 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Vivienda
      </Typography>

      {hasSectionErrors && (
        <Typography color="error" sx={{ mb: 2 }}>
          Corrige los errores de la información de vivienda
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid>
          <Controller
            name={name("landlordName")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nombre del arrendador"
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
            name={name("landlordPhone")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                    sx={textFieldSX}
                label="Teléfono del arrendador"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("rentValue")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                    sx={textFieldSX}
                type="number"
                label="Valor de arrendamiento"
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
            name={name("type")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                select
                {...field}
                label="Tipo de vivienda"
                    sx={textFieldSX}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                <MenuItem value="FAMILIAR">Familiar</MenuItem>
                <MenuItem value="PROPIA">Propia</MenuItem>
                <MenuItem value="ALQUILADA">Alquilada</MenuItem>
              </TextField>
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

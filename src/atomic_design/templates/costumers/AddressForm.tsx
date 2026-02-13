import { Grid, TextField, Box, Typography } from "@mui/material";
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

export const AddressForm = ({ control, prefix }: Props) => {
  const {
    formState: { errors },
  } = useFormContext<CostumerFormValues>();

  const name = (field: string) =>
    `${prefix}.${field}` as Path<CostumerFormValues>;

  // Errores de la sección (address)
  const sectionErrors = get(errors, prefix) as Record<string, unknown> | undefined;

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
                onChange={(e) =>
                  field.onChange(Number(e.target.value))
                }
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
      </Grid>
    </Box>
  );
};

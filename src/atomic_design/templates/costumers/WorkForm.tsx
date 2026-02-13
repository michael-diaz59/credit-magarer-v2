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

export const WorkForm = ({ control, prefix }: Props) => {
  const {
    formState: { errors },
  } = useFormContext<CostumerFormValues>();

  const name = (field: string) =>
    `${prefix}.${field}` as Path<CostumerFormValues>;

  // Errores de la sección laboral completa
  const sectionErrors = get(errors, prefix) as
    | Record<string, unknown>
    | undefined;

  const hasSectionErrors =
    sectionErrors && Object.keys(sectionErrors).length > 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Información laboral
      </Typography>

      {hasSectionErrors && (
        <Typography color="error" sx={{ mb: 2 }}>
          Corrige los errores de la información laboral
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid>
          <Controller
            name={name("profession")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Profesión"
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
            name={name("economicSector")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Sector económico"
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
            name={name("company")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                sx={textFieldSX}
                label="Compañía"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("companyAddress")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Dirección de la compañía"
                sx={textFieldSX}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

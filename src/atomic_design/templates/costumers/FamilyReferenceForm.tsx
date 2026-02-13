import { Grid, TextField, Box, Typography } from "@mui/material";
import {
  type Control,
  Controller,
  type Path,
  useFormContext,
} from "react-hook-form";
import type { CostumerFormValues } from "./SchemasCostumer";
import { get } from "react-hook-form";
import { AddressForm } from "./AddressForm";
import { WorkForm } from "./WorkForm";
import { textFieldSX } from "../../atoms/textFieldSX";

interface Props {
  control: Control<CostumerFormValues>;
  index: number;
}

export const FamilyReferenceForm = ({ control, index }: Props) => {
  const {
    formState: { errors },
  } = useFormContext<CostumerFormValues>();

  const basePath = `familyReference.${index}` as Path<CostumerFormValues>;

  const name = (field: string) =>
    `${basePath}.${field}` as Path<CostumerFormValues>;

  // Errores de la referencia familiar completa
  const sectionErrors = get(errors, basePath) as
    | Record<string, unknown>
    | undefined;

  const hasSectionErrors =
    sectionErrors && Object.keys(sectionErrors).length > 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Referencia familiar #{index + 1}
      </Typography>

      {hasSectionErrors && (
        <Typography color="error" sx={{ mb: 2 }}>
          Corrige los errores de esta referencia familiar
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid>
          <Controller
            name={name("fullName")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nombre completo"
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
            name={name("phone")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Teléfono"
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
            name={name("relationship")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Parentesco"
                fullWidth
                    sx={textFieldSX}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid>
          <AddressForm control={control} prefix={name("address")} />
        </Grid>
      </Grid>
      <Grid>
        <WorkForm control={control} prefix={name("workInfo")} />
      </Grid>
    </Box>
  );
};

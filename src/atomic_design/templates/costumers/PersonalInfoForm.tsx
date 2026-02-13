import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import {
  type Control,
  Controller,
  type Path,
  useFormContext,
} from "react-hook-form";
import type { CostumerFormValues } from "./SchemasCostumer";
import { AddressForm } from "./AddressForm";
import { WorkForm } from "./WorkForm";
import { HousingForm } from "./HousingForm";
import { textFieldSX } from "../../atoms/textFieldSX";

interface Props {
  control: Control<CostumerFormValues>;
  prefix: Path<CostumerFormValues>;
  index?: number;
}

export const PersonalInfoForm = ({ control, prefix, index }: Props) => {
  const name = (field: string) =>
    `${prefix}.${field}` as Path<CostumerFormValues>;

  const {
    formState: { errors },
  } = useFormContext<CostumerFormValues>();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Información personal
      </Typography>

      {index != undefined && index >= 0 ? (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Codeudor #{index + 1}
        </Typography>
      ) : null}
      {errors.applicant && (
        <Typography variant="subtitle2" color="error">
          Hay errores en la información personal
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
            name={name("idNumber")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="cedula"
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
            name={name("birthCity")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Ciudad de nacimiento"
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
            name={name("birthDate")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="date"
                label="Fecha nacimiento"
                InputLabelProps={{ shrink: true }}
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
            name={name("issueCity")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Ciudad expedición"
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
            name={name("issueDate")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="date"
                label="Fecha de expedicion"
                    sx={textFieldSX}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("maritalStatus")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                select
                {...field}
                label="Estado civil"
                fullWidth
                    sx={textFieldSX}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              >
                <MenuItem value="SOLTERO">Soltero</MenuItem>
                <MenuItem value="CASADO">Casado</MenuItem>
                <MenuItem value="UNION_LIBRE">Unión libre</MenuItem>
                <MenuItem value="DIVORCIADO">Divorciado</MenuItem>
                <MenuItem value="VIUDO">Viudo</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid>
          <Controller
            name={name("childrenCount")}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label="Número de hijos"
                    sx={textFieldSX}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid>
          <Controller
            name={name("phone")}
            control={control}
            render={({ field }) => (
              <TextField {...field} label="telefono" fullWidth required     sx={textFieldSX}/>
            )}
          />
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid>
          <AddressForm control={control} prefix={name("address")} />
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Grid>
          <WorkForm control={control} prefix={name("workInfo")} />
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid>
          <HousingForm control={control} prefix={name("housing")} />
        </Grid>
      </Grid>
    </Box>
  );
};

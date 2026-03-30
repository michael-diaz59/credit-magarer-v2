import { Stack, TextField, MenuItem, Grid } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import type Visit from "../../../features/visits/domain/business/entities/Visit";
import { textFieldSX } from "../../atoms/textFieldSX";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import { mergeDefined } from "../../sub_atomic_particles/helpers";
import type { User } from "../../../features/users/domain/business/entities/User";

const defaultValues: Visit = {
  id: "",
  customerName: "",
  customerId: "",
  customerDocument: "",
  custumerAddres: "",
  observations: "",
  userAssigned: "",
  creatorsId: "",
  hasdebt: false,
  debitId: "",
  amountSolicited: 0,
  createdAt: "",
  state: { code: "earring" }
};

export type VisitFormRef = {
  validate: () => Promise<boolean>;
  validateFields: (fields: (keyof Visit)[]) => Promise<boolean>;
  getValues: () => Visit;
};

export type VisitFormConfig = {
  visibleFields?: (keyof Visit)[];
  editableFields?: (keyof Visit)[];
  requiredFields?: (keyof Visit)[];
};

type Props = {
  config?: VisitFormConfig;
  advisors: User[];
  visit?: Visit;
};

export const VisitForm = forwardRef<VisitFormRef, Props>(
  ({ config, advisors, visit }, ref) => {

    const isVisible = (field: keyof Visit) =>
      config?.visibleFields?.includes(field) ?? true;

    const isEditable = (field: keyof Visit) =>
      config?.editableFields?.includes(field) ?? true;

    const isRequired = (field: keyof Visit) =>
      config?.requiredFields?.includes(field) ?? false;

    const formDefaults = useMemo(
      () => mergeDefined(defaultValues, visit),
      [visit]
    );

    const {
      control,
      trigger,
      getValues,
      formState: { errors },
    } = useForm<Visit>({
      defaultValues: formDefaults,
    });

    useImperativeHandle(ref, () => ({
      validate: async () => await trigger(),
      validateFields: async (fields) => await trigger(fields),
      getValues: () => getValues(),
    }));

    return (
      <Grid container spacing={2}>
        <Stack spacing={2}>

          {/* Observaciones */}
          <Controller
            name="observations"
            control={control}
            rules={{
              ...(isRequired("observations") && {
                required: "Observaciones obligatorias"
              }),
              maxLength: {
                value: 500,
                message: "Máximo 500 caracteres"
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Observaciones"
                multiline
                rows={3}
                sx={textFieldSX}
                disabled={!isEditable("observations")}
                error={!!errors.observations}
                helperText={errors.observations?.message}
              />
            )}
          />

          {/* Asesor */}
          {isVisible("userAssigned") && (
            <Controller
              name="userAssigned"
              control={control}
              rules={{
                ...(isRequired("userAssigned") && {
                  required: "Debe seleccionar un asesor"
                })
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Asesor de campo"
                  sx={textFieldSX}
                  disabled={!isEditable("userAssigned")}
                  error={!!errors.userAssigned}
                  helperText={errors.userAssigned?.message}
                >
                  <MenuItem value="">
                    <em>Seleccione un asesor</em>
                  </MenuItem>

                  {advisors.map((advisor) => (
                    <MenuItem key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          {/* Documento cliente */}
          <Controller
            name="customerDocument"
            control={control}
            rules={{
              ...(isRequired("customerDocument") && {
                required: "Documento obligatorio"
              })
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Cliente (Cédula)"
                sx={textFieldSX}
                disabled={!isEditable("customerDocument")}
                error={!!errors.customerDocument}
                helperText={errors.customerDocument?.message}
              />
            )}
          />

        </Stack>
      </Grid>
    );
  }
);
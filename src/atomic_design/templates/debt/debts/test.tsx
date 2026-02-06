import { Button, MenuItem, Stack, TextField } from "@mui/material";


import { Controller, useForm } from "react-hook-form";
import type { Debt, DebtStatus, DebtType } from "../../../../features/debits/domain/business/entities/Debt";
import type { DebtFormMode } from "../DebtFormMode";

export type DebtFormAction = "create" | "update" | "preApprove";

export type DebtFormProps = {
  defaultValues: Omit<Debt, "id">;
  mode: DebtFormMode;
  allowedActions: DebtFormAction[];
  onSubmit: (action: DebtFormAction, data: Omit<Debt, "id">) => void;
};

// ... (tus listas debtStatusList y debtTypes siguen igual) ...
const debtStatusList: DebtStatus[] = ["tentativa", "preparacion", "activa", "en_mora", "pagada", "cancelada", "preAprobada"];
const debtTypes: DebtType[] = ["credito", "prenda"];

export const DebtFormT = ({
  defaultValues,
  mode,
  allowedActions,
  onSubmit,
}: DebtFormProps) => {
  const readOnly = mode === "view";
  const canEditStatus = mode === "audit";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Omit<Debt, "id">>({ defaultValues });

  // 1. Creamos una función intermedia que reciba la acción
  const handleFormSubmit = (data: Omit<Debt, "id">, action: DebtFormAction) => {
    console.log("Ejecutando acción:", action);
    onSubmit(action, data);
  };

  return (
    <form> {/* Quitamos el onSubmit de la etiqueta form */}
      <Stack spacing={2}>
         {canEditStatus && (
                 <Controller
                   name="status"
                   control={control}
                   rules={{ required: "El estado es obligatorio" }}
                   render={({ field }) => (
                     <TextField
                       {...field}
                       select
                       label="Estado"
                       fullWidth
                       error={!!errors.status}
                       helperText={errors.status?.message}
                     >
                       {debtStatusList.map((s) => (
                         <MenuItem key={s} value={s}>
                           {s}
                         </MenuItem>
                       ))}
                     </TextField>
                   )}
                 />
               )}
        <TextField 
          label="Cédula" 
          fullWidth 
          {...register("costumerDocument", { required: "Obligatorio" })} 
          error={!!errors.costumerDocument}
        />

        
                {/* TIPO */}
                <Controller
                  name="type"
                  control={control}
                  disabled={mode === "view"}
                  rules={{ required: "El tipo es obligatorio" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Tipo"
                      fullWidth
                      error={!!errors.type}
                      helperText={errors.type?.message}
                    >
                      {debtTypes.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
        
                {/* MONTO */}
                <TextField
                  label="Monto total"
                  type="number"
                  disabled={mode === "view" || mode == "audit"}
                  fullWidth
                  error={!!errors.totalAmount}
                  helperText={errors.totalAmount?.message}
                  {...register("totalAmount", {
                    valueAsNumber: true,
                    required: "Monto obligatorio",
                    min: { value: 10001, message: "debe ser mayor a 10000" },
                  })}
                />
        
                {/* FECHA */}
                <TextField
                  label="Fecha de inicio"
                  disabled={mode === "view" || mode == "audit"}
                  type="date"
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("startDate", {
                    required: "Fecha obligatoria",
                  })}
                />
        
      </Stack>

      {/* ACTION BUTTONS */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
        
        {allowedActions.includes("create") && (
          <Button
            variant="contained"
            // 2. Llamamos a handleSubmit directamente aquí pasando la acción
            onClick={handleSubmit((data) => handleFormSubmit(data, "create"))}
          >
            Crear deuda
          </Button>
        )}

        {allowedActions.includes("update") && !readOnly && (
          <Button
            variant="contained"
            onClick={handleSubmit((data) => handleFormSubmit(data, "update"))}
          >
            Actualizar deuda
          </Button>
        )}

        {allowedActions.includes("preApprove") && !readOnly && (
          <Button
            variant="contained"
            color="warning"
            onClick={handleSubmit((data) => handleFormSubmit(data, "preApprove"))}
          >
            Pre-aprobar deuda
          </Button>
        )}
      </Stack>
    </form>
  );
};
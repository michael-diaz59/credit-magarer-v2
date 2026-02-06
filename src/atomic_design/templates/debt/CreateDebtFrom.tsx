import { Stack, TextField, MenuItem, Button } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type {
  Debt,
  DebtStatus,
  DebtTerms,
  DebtType,
} from "../../../features/debits/domain/business/entities/Debt";
import type { DebtFormMode } from "./DebtFormMode";

const debtTypes: DebtType[] = ["credito", "prenda"];
const debtTermsList: DebtTerms[] = [
  "diario",
  "semanal",
  "quincenal",
  "mensual",
];
const debtStatusList: DebtStatus[] = [
  "tentativa",
  "preparacion",
  "activa",
  "en_mora",
  "pagada",
  "cancelada",
];

type Props = {
  defaultValues: Omit<Debt, "id">;
  mode: DebtFormMode;
  onSubmit: (data: Omit<Debt, "id">) => void;
};

export const CreateDebtFrom = ({ defaultValues, mode, onSubmit }: Props) => {
  const readOnly = mode === "view";
  const canEditStatus = mode === "audit";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Omit<Debt, "id">>({
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {/* ---------- STATUS (solo audit) ---------- */}
        {canEditStatus && (
          <Controller
            name="status"
            control={control}
            rules={{ required: "El estado es obligatorio" }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Estado de la deuda"
                fullWidth
                error={!!errors.status}
                helperText={errors.status?.message}
              >
                {debtStatusList.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}

        {/* ---------- CÉDULA ---------- */}
        <TextField
          label="Cédula del cliente"
          fullWidth
          InputProps={{ readOnly }}
          error={!!errors.costumerDocument}
          helperText={errors.costumerDocument?.message}
          {...register("costumerDocument", {
            required: "La cédula es obligatoria",
          })}
        />

        {/* ---------- TIPO DE DEUDA ---------- */}
        <Controller
          name="type"
          control={control}
          rules={{ required: "El tipo de deuda es obligatorio" }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Tipo de deuda"
              fullWidth
              InputProps={{ readOnly }}
              error={!!errors.type}
              helperText={errors.type?.message}
            >
              {debtTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* ---------- INTERÉS ---------- */}
        <TextField
          label="Tasa de interés (%)"
          type="number"
          fullWidth
          InputProps={{ readOnly }}
          error={!!errors.interestRate}
          helperText={errors.interestRate?.message}
          {...register("interestRate", {
             valueAsNumber: true,
            min: {
              value: 0,
              message: "La tasa no puede ser negativa",
            },
          })}
        />

        {/* ---------- MONTO ---------- */}
        <TextField
          label="Monto total"
          type="number"
          fullWidth
          InputProps={{ readOnly }}
          error={!!errors.totalAmount}
          helperText={errors.totalAmount?.message}
          {...register("totalAmount", {
             valueAsNumber: true,
            required: "El monto es obligatorio",
            min: {
              value: 10001,
              message: "El monto debe ser mayor a 10000",
            },
          })}
        />

        {/* ---------- FRECUENCIA ---------- */}
        <Controller
          name="debtTerms"
          control={control}
          rules={{ required: "La frecuencia es obligatoria" }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Frecuencia de cuotas"
              fullWidth
              InputProps={{ readOnly }}
              error={!!errors.debtTerms}
              helperText={errors.debtTerms?.message}
            >
              {debtTermsList.map((term) => (
                <MenuItem key={term} value={term}>
                  {term}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* ---------- CUOTAS ---------- */}
        <TextField
          label="Número de cuotas"
          type="number"
          fullWidth
          InputProps={{ readOnly }}
          error={!!errors.installmentCount}
          helperText={errors.installmentCount?.message}
          {...register("installmentCount", {
             valueAsNumber: true,
            min: {
              value: 1,
              message: "Debe haber al menos una cuota",
            },
          })}
        />

        {/* ---------- FECHA INICIO ---------- */}
        <TextField
          label="Fecha de inicio"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          InputProps={{ readOnly }}
          error={!!errors.startDate}
          helperText={errors.startDate?.message}
          {...register("startDate", {
            required: "La fecha de inicio es obligatoria",
          })}
        />
      </Stack>

      {/* ---------- ACTIONS ---------- */}
      {mode === "create" && (
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button type="submit" variant="contained">
            Crear deuda
          </Button>
        </Stack>
      )}
    </form>
  );
};

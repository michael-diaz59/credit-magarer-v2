import { forwardRef, useImperativeHandle } from "react";
import { useForm, Controller } from "react-hook-form";
import { TextField, MenuItem, Stack, Grid, Box, Typography } from "@mui/material";
import { type BankAccount } from "../../../features/bankAccounts/domain/business/entities/BankAccount";
import { type PaymentMethod, type PaymentStatus } from "../../../features/debits/domain/business/entities/Payment";
import { type CategoryPayment } from "../../../features/anotherPayment/domain/business/entities/AnotherPayment";
import { MoneyField } from "../../atoms/MoneyField";

export interface AnotherPaymentFormValues {
  createdAt: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  bankAccountId: string;
  observations: string;
  category: CategoryPayment;
  file?: File;
}

export interface AnotherPaymentFormRef {
  validate: () => Promise<boolean>;
  getValues: () => AnotherPaymentFormValues;
}

interface Props {
  bankAccounts: BankAccount[];
  defaultValues?: Partial<AnotherPaymentFormValues>;
}

export const AnotherPaymentForm = forwardRef<AnotherPaymentFormRef, Props>(
  ({ bankAccounts, defaultValues }, ref) => {
    const {
      control,
      getValues,
      trigger,
      setValue,
      formState: { errors },
    } = useForm<AnotherPaymentFormValues>({
      defaultValues: {
        createdAt: new Date().toISOString().slice(0, 10),
        amount: 0,
        method: "efectivo",
        status: "registrado",
        bankAccountId: "",
        observations: "",
        category: "other",
        ...defaultValues,
      },
    });

    useImperativeHandle(ref, () => ({
      validate: async () => await trigger(),
      getValues: () => getValues(),
    }));

    return (
      <Grid container spacing={4}>
        <Grid >
          <Stack spacing={3}>
            <Controller
              name="category"
              control={control}
              rules={{ required: "La categoría es obligatoria" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Categoría de Pago"
                  fullWidth
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  <MenuItem value="other">Otro</MenuItem>
                  <MenuItem value="pagos a inversores">Pagos a Inversores</MenuItem>
                  <MenuItem value="descuadre">Descuadre</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="createdAt"
              control={control}
              rules={{ required: "La fecha es obligatoria" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha de Pago"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.createdAt}
                  helperText={errors.createdAt?.message}
                />
              )}
            />

            <MoneyField<AnotherPaymentFormValues>
              name="amount"
              control={control}
              label="Monto"
              rules={{ required: "El monto es obligatorio", min: { value: 1, message: "El monto debe ser mayor a 0" } }}
            />
          </Stack>
        </Grid>

        <Grid >
          <Stack spacing={3}>
            <Controller
              name="method"
              control={control}
              rules={{ required: "El método es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Método de Pago"
                  fullWidth
                  error={!!errors.method}
                  helperText={errors.method?.message}
                >
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                </TextField>
              )}
            />

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
                  <MenuItem value="registrado">Registrado</MenuItem>
                  <MenuItem value="conflicto">Conflicto</MenuItem>
                  <MenuItem value="confirmado">Confirmado</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="bankAccountId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Cuenta Bancaria (Opcional)"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Sin cuenta bancaria</em>
                  </MenuItem>
                  {bankAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber} ({acc.name})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </Grid>

        <Grid >
          <Stack spacing={2}>
            <Controller
              name="observations"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Observaciones"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Detalles adicionales..."
                />
              )}
            />

            <Box
              sx={{
                p: 2,
                border: "1px dashed #ccc",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography variant="subtitle2">Comprobante de Pago</Typography>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setValue("file", file);
                }}
                accept="image/*,application/pdf"
              />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    );
  }
);

import { forwardRef, useImperativeHandle } from "react";
import { useForm, Controller } from "react-hook-form";
import { TextField, MenuItem, Stack, Grid, Box, Typography } from "@mui/material";
import { type BankAccount } from "../../../features/bankAccounts/domain/business/entities/BankAccount";
import { type PaymentMethod, type PaymentStatus } from "../../../features/debits/domain/business/entities/Payment";
import { MoneyField } from "../../atoms/MoneyField";

export interface TaxtPaymentFormValues {
  createdAt: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  bankAccountId: string;
  observations: string;
  file?: File;
}

export interface TaxtPaymentFormRef {
  validate: () => Promise<boolean>;
  getValues: () => TaxtPaymentFormValues;
}

interface Props {
  bankAccounts: BankAccount[];
  defaultValues?: Partial<TaxtPaymentFormValues>;
}

export const TaxtPaymentForm = forwardRef<TaxtPaymentFormRef, Props>(
  ({ bankAccounts, defaultValues }, ref) => {
    const {
      control,
      getValues,
      trigger,
      setValue,
      formState: { errors },
    } = useForm<TaxtPaymentFormValues>({
      defaultValues: {
        createdAt: new Date().toISOString().slice(0, 10),
        amount: 0,
        method: "efectivo",
        status: "registrado",
        bankAccountId: "",
        observations: "",
        ...defaultValues,
      },
    });

    useImperativeHandle(ref, () => ({
      validate: async () => await trigger(),
      getValues: () => getValues(),
    }));

    return (
      <Grid container spacing={4}>
        <Grid>
          <Stack spacing={3}>
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

            <MoneyField<TaxtPaymentFormValues>
              name="amount"
              control={control}
              label="Monto"
              rules={{ required: "El monto es obligatorio", min: { value: 1, message: "El monto debe ser mayor a 0" } }}
            />

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
          </Stack>
        </Grid>

        <Grid >
          <Stack spacing={3}>
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
                  error={!!errors.bankAccountId}
                  helperText={errors.bankAccountId?.message}
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

            <Controller
              name="observations"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Observaciones"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Detalles adicionales del pago..."
                />
              )}
            />
          </Stack>
        </Grid>

        <Grid>
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
        </Grid>
      </Grid>
    );
  }
);

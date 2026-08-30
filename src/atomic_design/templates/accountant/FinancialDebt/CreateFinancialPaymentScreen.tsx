
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useForm, Controller } from "react-hook-form";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { MoneyField } from "../../../atoms/MoneyField";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { getCurrentLocation } from "../../../../core/shared/helpers/geoLocation";
import BankAccountOrchestrator from "../../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import FinancialDebtOrchestrator from "../../../../features/financialDebt/domain/infraestructure/FinancialDebtOrchestrator";
import FinancialPaymentOrchestrator from "../../../../features/financialDebt/domain/infraestructure/FinancialPaymentOrchestrator";
import type { FinancialDebt } from "../../../../features/financialDebt/domain/business/entities/FinancialDebt";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";
import type { PaymentMethod } from "../../../../features/debits/domain/business/entities/Payment";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import type { LocationGPS } from "../../../../features/costumers/domain/business/entities/Address";

export const CreateFinancialPaymentScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user.user);
  const companyId = user?.companyId || "";

  const [debt, setDebt] = useState<FinancialDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("efectivo");
  const [file, setFile] = useState<File | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<{ amount: number; bankAccountId?: string } | null>(null);

  const [dialog, setDialog] = useState({
    open: false,
    message: "",
    success: false,
  });

  const { control, handleSubmit } = useForm({
    defaultValues: {
      amount: 0,
      bankAccountId: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !companyId) return;
      setLoading(true);
      try {
        const debtOrchestrator = new FinancialDebtOrchestrator();
        const bankOrchestrator = new BankAccountOrchestrator();

        const [debtRes, bankRes] = await Promise.all([
          debtOrchestrator.getFinancialDebtById({ companyId, id }),
          bankOrchestrator.getAll({ companyId }),
        ]);

        if (debtRes.ok) setDebt(debtRes.value);
        if (bankRes.ok) setBankAccounts(bankRes.value.bankAccounts);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, companyId]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const registerPayment = async (values: { amount: number; bankAccountId?: string }, location?: LocationGPS | null) => {
    setSaving(true);
    try {
      const orchestrator = new FinancialPaymentOrchestrator();
      const result = await orchestrator.registerPayment({
        companyId,
        file: file || undefined,
        payment: {
          financialDebtId: id!,
          amount: values.amount,
          createAt: new Date().toISOString(),
          method: selectedMethod,
          collectorId: user?.id || "unknown",
          collectorName: user?.name || "Unknown",
          bankAccountId: values.bankAccountId,
          location: location || undefined,
        },
      });

      if (result.ok) {
        setDialog({ open: true, message: "Pago registrado correctamente", success: true });
      } else {
        setDialog({ open: true, message: "Error al registrar el pago", success: false });
      }
    } catch (error) {
      console.error(error);
      setDialog({ open: true, message: "Error inesperado", success: false });
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (values: { amount: number; bankAccountId?: string }) => {
    if (selectedMethod === "consignacion" && !file) {
      setDialog({ open: true, message: "Debe subir un comprobante para consignación", success: false });
      return;
    }

    setPendingValues(values);
    try {
      const location = await getCurrentLocation();
      await registerPayment(values, location);
    } catch (error) {
      console.warn("Could not get location:", error);
      setLocationDialogOpen(true);
    }
  };

  const handleLocationResponse = async (confirm: boolean) => {
    setLocationDialogOpen(false);
    if (confirm && pendingValues) {
      await registerPayment(pendingValues, null);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (!debt) return <Typography p={3}>Financiamiento no encontrado</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h4" mb={4} fontWeight="bold" color="primary" textAlign="center">
        Registrar Pago para {debt.name}
      </Typography>

      <Box maxWidth={600} mx="auto">
        <Card variant="outlined" sx={{ boxShadow: 3, borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4} component="form" onSubmit={handleSubmit(onSubmit)}>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Monto del Pago</Typography>
                <MoneyField
                  name="amount"
                  control={control}
                  label="Valor a pagar"
                  rules={{ required: "El monto es obligatorio", min: { value: 1, message: "Debe ser mayor a 0" } }}
                />
              </Box>

              <Box>
                <FormLabel component="legend">Método de Pago</FormLabel>
                <RadioGroup value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}>
                  <FormControlLabel value="efectivo" control={<Radio />} label="Efectivo" />
                  <FormControlLabel value="consignacion" control={<Radio />} label="Consignación / Transferencia" />
                </RadioGroup>
              </Box>

              {selectedMethod === "consignacion" && (
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Cuenta Bancaria</InputLabel>
                    <Controller
                      name="bankAccountId"
                      control={control}
                      rules={{ required: selectedMethod === "consignacion" ? "La cuenta es obligatoria" : false }}
                      render={({ field }) => (
                        <Select {...field} label="Cuenta Bancaria">
                          {bankAccounts.map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.name}</MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ borderStyle: "dashed", py: 2 }}
                  >
                    {file ? file.name : "Subir Comprobante"}
                    <input type="file" hidden accept="image/*,application/pdf" onChange={onFileChange} />
                  </Button>
                </Stack>
              )}

              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={saving}
                sx={{ py: 1.5, fontWeight: "bold", borderRadius: 3 }}
              >
                {saving ? <CircularProgress size={24} color="inherit" /> : "Registrar Pago"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={locationDialogOpen} onClose={() => setLocationDialogOpen(false)}>
        <DialogTitle>Ubicación no disponible</DialogTitle>
        <DialogContent>
          <Typography>No se pudo obtener la ubicación GPS. ¿Desea registrar el pago de todas formas?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => handleLocationResponse(true)} variant="contained">Registrar sin GPS</Button>
        </DialogActions>
      </Dialog>

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        onClick={() => {
          setDialog({ ...dialog, open: false });
          if (dialog.success) navigate(ScreenPaths.accountant.financialDebts);
        }}
        butonText="Aceptar"
      />
    </Box>
  );
};

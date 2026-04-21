
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { MoneyField } from "../../../atoms/MoneyField";
import { BaseDialog } from "../../../atoms/BaseDialog";
import FinancialDebtOrchestrator from "../../../../features/financialDebt/domain/infraestructure/FinancialDebtOrchestrator";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import type { FinancialDebt } from "../../../../features/financialDebt/domain/business/entities/FinancialDebt";

interface FinancialDebtFormValues {
  amount: number;
  installmentAmount: number;
  periocidad: "mensual" | "quincenal";
  startDate: string;
  createdAt: string;
}

export const FinancialDebtRegistrationScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId) || "";

  const [file, setFile] = useState<File | null>(null);
  const [existingDebt, setExistingDebt] = useState<FinancialDebt | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    message: "",
    success: false,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FinancialDebtFormValues>({
    defaultValues: {
      amount: 0,
      installmentAmount: 0,
      periocidad: "mensual",
      startDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (isEdit && companyId) {
      const fetchDebt = async () => {
        try {
          const orchestrator = new FinancialDebtOrchestrator();
          const result = await orchestrator.getFinancialDebtById({ companyId, id });
          if (result.ok && result.value) {
            setExistingDebt(result.value);
            reset({
              amount: result.value.amount,
              installmentAmount: result.value.installmentAmount,
              periocidad: result.value.periocidad,
              startDate: result.value.startDate,
              createdAt: result.value.createdAt,
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchDebt();
    }
  }, [isEdit, id, companyId, reset]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const onSubmit = async (values: FinancialDebtFormValues) => {
    if (!companyId) return;
    if (!file && !isEdit) {
      setDialog({
        open: true,
        message: "Debe subir un comprobante de la deuda",
        success: false,
      });
      return;
    }

    setSaving(true);
    try {
      const orchestrator = new FinancialDebtOrchestrator();

      if (isEdit && existingDebt) {
        const result = await orchestrator.updateFinancialDebt({
          companyId,
          financialDebt: {
            ...existingDebt,
            ...values,
          },
          newFile: file || undefined,
        });

        if (result.ok) {
          setDialog({ open: true, message: "Financiamiento actualizado correctamente", success: true });
        } else {
          setDialog({ open: true, message: "Error al actualizar", success: false });
        }
      } else {
        const result = await orchestrator.createFinancialDebt({
          companyId,
          ...values,
          file: file!,
        });

        if (result.ok) {
          setDialog({ open: true, message: "Financiamiento registrado correctamente", success: true });
          reset();
          setFile(null);
        } else {
          setDialog({ open: true, message: "Error al registrar", success: false });
        }
      }
    } catch (error) {
      console.error(error);
      setDialog({ open: true, message: "Error inesperado", success: false });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={4} fontWeight="bold" color="primary" textAlign="center">
        {isEdit ? `Editar ${existingDebt?.name}` : "Registrar Pago de Deuda Financiera"}
      </Typography>

      <Box maxWidth={600} mx="auto">
        {isEdit && (
          <Stack spacing={2} mb={3}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              onClick={() => navigate(ScreenPaths.accountant.financialDebtPayment(id!))}
              sx={{ py: 1.5, fontWeight: "bold", borderRadius: 3 }}
            >
              Registrar Pago / Abono
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              size="large"
              onClick={() => navigate(ScreenPaths.accountant.financialDebtHistory(id!))}
              sx={{ py: 1.5, fontWeight: "bold", borderRadius: 3 }}
            >
              Ver historial de pagos del financiamiento
            </Button>
          </Stack>
        )}

        <Card variant="outlined" sx={{ boxShadow: 3, borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4} component="form" onSubmit={handleSubmit(onSubmit)}>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Valor Total de la Deuda
                </Typography>
                <MoneyField
                  name="amount"
                  control={control}
                  label="Monto Total"
                  rules={{ required: "El monto es obligatorio", min: { value: 1, message: "El valor debe ser mayor a 0" } }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Monto de la Cuota
                </Typography>
                <MoneyField
                  name="installmentAmount"
                  control={control}
                  label="Valor por cuota"
                  rules={{ required: "El valor de la cuota es obligatorio", min: { value: 1, message: "El valor debe ser mayor a 0" } }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Periodicidad
                </Typography>
                <FormControl fullWidth>
                  <Controller
                    name="periocidad"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value="mensual">Mensual</MenuItem>
                        <MenuItem value="quincenal">Quincenal</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Fecha de Inicio
                </Typography>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: "La fecha de inicio es obligatoria" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                      fullWidth
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Comprobante (Obligatorio al crear)
                </Typography>
                {!file ? (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{
                      height: 100,
                      borderStyle: "dashed",
                      borderRadius: 3,
                    }}
                  >
                    {isEdit ? "Actualizar Comprobante" : "Subir Archivo / Tomar Foto"}
                    <input type="file" hidden accept="image/*,application/pdf" onChange={onFileChange} />
                  </Button>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                      bgcolor: "action.hover",
                    }}
                  >
                    <Typography variant="body2" sx={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {file.name}
                    </Typography>
                    <IconButton onClick={removeFile} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={saving}
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  borderRadius: 3,
                  boxShadow: 4,
                }}
              >
                {saving ? <CircularProgress size={24} color="inherit" /> : (isEdit ? "Guardar Cambios" : "Registrar Financiamiento")}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        onClick={() => {
          setDialog({ ...dialog, open: false });
          if (dialog.success && !isEdit) navigate(ScreenPaths.accountant.financialDebts);
        }}
        butonText="Aceptar"
      />
    </Box>
  );
};

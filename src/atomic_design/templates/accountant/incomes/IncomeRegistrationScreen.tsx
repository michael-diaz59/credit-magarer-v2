import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Chip,
  Divider,
} from "@mui/material";
import {
  CameraAlt as CameraAltIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { MoneyField } from "../../../atoms/MoneyField";
import BankAccountOrchestrator from "../../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import CompanyOrchestrator from "../../../../features/company/domain/infraestructure/CompanyOrchestrator";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";
import { BaseDialog } from "../../../atoms/BaseDialog";

interface IncomeFormValues {
  investorName: string;
  amount: number;
  description: string;
  entryType: "efectivo" | "consignacion" | "otro";
  bankAccountId?: string;
}

export const IncomeRegistrationScreen: React.FC = () => {
  const companyId = useAppSelector((state) => state.user.user?.companyId) || "";
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dialog, setDialog] = useState({
    open: false,
    message: "",
    success: false
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    defaultValues: {
      investorName: "",
      amount: 0,
      description: "",
      entryType: "efectivo",
      bankAccountId: "",
    },
  });

  const entryType = watch("entryType");

  useEffect(() => {
    if (entryType === "consignacion") {
      fetchBankAccounts();
    }
  }, [entryType]);

  const fetchBankAccounts = async () => {
    if (!companyId) return;
    setLoadingAccounts(true);
    try {
      const orchestrator = new BankAccountOrchestrator();
      const result = await orchestrator.getAll({ companyId });
      if (result.ok) {
        setBankAccounts(result.value.bankAccounts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProofFile(file);
    // Limpiar input para permitir re-selección del mismo archivo
    e.target.value = "";
  };

  const removeProofFile = () => setProofFile(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon fontSize="small" />;
    return <DescriptionIcon fontSize="small" />;
  };

  const onSubmit = async (values: IncomeFormValues) => {
    if (!companyId) return;
    setSaving(true);
    try {
      const orchestrator = new CompanyOrchestrator();
      const result = await orchestrator.registerIncome({
        companyId,
        income: {
          id: "",
          idProof: "",
          date: new Date().toISOString(),
          name: `Ingreso - ${values.investorName}`,
          investorName: values.investorName,
          amount: values.amount,
          description: values.description,
          entryType: values.entryType,
          bankAccountId: values.bankAccountId,
          createdAt: new Date().toISOString(),
        },
        file: proofFile ?? undefined,
      });

      if (result.ok) {
        setDialog({
          open: true,
          message: "Ingreso registrado correctamente",
          success: true
        });
        reset();
        setProofFile(null);
      } else {
        const errorMessages: Record<string, string> = {
          UPLOAD_ERROR: "Error al subir el comprobante. El ingreso no fue guardado.",
          PERSISTENCE_ERROR: "Error al guardar el ingreso.",
          UNKNOWN_ERROR: "Error inesperado.",
        };
        setDialog({
          open: true,
          message: errorMessages[result.error.code] ?? "Error al registrar el ingreso",
          success: false
        });
      }
    } catch (error) {
      console.error(error);
      setDialog({
        open: true,
        message: "Error inesperado",
        success: false
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4">Registro de Ingresos</Typography>
      <Box p={3} maxWidth={600} mx="auto">
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="h6">Información de la Inversión</Typography>

              <Controller
                name="investorName"
                control={control}
                rules={{ required: "El nombre del inversor es obligatorio" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre del inversor"
                    error={!!errors.investorName}
                    helperText={errors.investorName?.message}
                    fullWidth
                  />
                )}
              />

              <MoneyField
                name="amount"
                control={control}
                label="Valor de la inversión"
                rules={{ min: { value: 1, message: "El valor debe ser mayor a 0" } }}
              />

              <Controller
                name="description"
                control={control}
                rules={{ required: "La descripción es obligatoria" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción de la inversión"
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    fullWidth
                  />
                )}
              />

              <FormControl fullWidth error={!!errors.entryType}>
                <InputLabel>Tipo de entrada</InputLabel>
                <Controller
                  name="entryType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo de entrada">
                      <MenuItem value="efectivo">Efectivo</MenuItem>
                      <MenuItem value="consignacion">Consignación / Transferencia</MenuItem>
                      <MenuItem value="otro">Otro</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              {entryType === "consignacion" && (
                <FormControl fullWidth error={!!errors.bankAccountId}>
                  <InputLabel>Cuenta Bancaria (Opcional)</InputLabel>
                  <Controller
                    name="bankAccountId"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Cuenta Bancaria (Opcional)">
                        <MenuItem value="">
                          <em>Ninguna</em>
                        </MenuItem>
                        {loadingAccounts ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} /> Cargando...
                          </MenuItem>
                        ) : (
                          bankAccounts.map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>
                              {acc.name} - {acc.bankName}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {loadingAccounts ? "Buscando cuentas bancarias..." : ""}
                  </FormHelperText>
                </FormControl>
              )}

              {/* ── Sección Comprobante ── */}
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Comprobante de pago (opcional)
                </Typography>
                <Stack direction="row" spacing={2} mb={proofFile ? 1.5 : 0}>
                  {/* Tomar foto */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CameraAltIcon />}
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={saving}
                  >
                    Tomar foto
                  </Button>
                  {/* Subir archivo */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    Subir archivo
                  </Button>
                </Stack>

                {/* Preview del archivo seleccionado */}
                {proofFile && (
                  <Chip
                    icon={getFileIcon(proofFile)}
                    label={proofFile.name}
                    onDelete={removeProofFile}
                    deleteIcon={<CloseIcon />}
                    variant="outlined"
                    color="primary"
                    sx={{ maxWidth: "100%", mt: 1 }}
                  />
                )}

                {/* Inputs ocultos */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? <CircularProgress size={24} color="inherit" /> : "Registrar entrada"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        onClick={() => setDialog({ ...dialog, open: false })}
        butonText="Aceptar"
      />
    </Box>
  );
};



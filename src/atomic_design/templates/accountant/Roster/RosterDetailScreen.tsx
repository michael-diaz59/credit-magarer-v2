
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../../../store/redux/coreRedux";
import { MoneyField } from "../../../atoms/MoneyField";
import { BaseDialog } from "../../../atoms/BaseDialog";
import RosterOrchestrator from "../../../../features/roster/domain/infraestructure/RosterOrchestrator";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import type { User } from "../../../../features/users/domain/business/entities/User";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, RadioGroup, Radio, FormLabel, IconButton } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import BankAccountOrchestrator from "../../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";
import PayrollOrchestrator from "../../../../features/roster/domain/infraestructure/PayrollOrchestrator";
import type { PayrollPaymentMethod } from "../../../../features/roster/domain/business/entities/Payroll";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";

interface RosterFormValues {
  periodicity: "mensual" | "quincenal";
  startDate: string;
  salary: number;
}

export const RosterDetailScreen = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId) || "";

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    message: "",
    success: false,
  });
  const dispatch = useAppDispatch();

  const rosterOrchestrator = useMemo(() => new RosterOrchestrator(), []);
  const userOrchestrator = useMemo(() => new UserOrchestrator(dispatch), []);
  const bankAccountOrchestrator = useMemo(() => new BankAccountOrchestrator(), []);
  const payrollOrchestrator = useMemo(() => new PayrollOrchestrator(), []);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PayrollPaymentMethod>("efectivo");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RosterFormValues>({
    defaultValues: {
      periodicity: "mensual",
      startDate: new Date().toISOString().slice(0, 10),
      salary: 0,
    },
  });

  const salary = control._getWatch("salary");

  useEffect(() => {
    setPaymentAmount(salary || 0);
  }, [salary]);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (!companyId) return;
      const res = await bankAccountOrchestrator.getAll({ companyId });
      if (res.ok) {
        setBankAccounts(res.value.bankAccounts);
      }
    };
    fetchBankAccounts();
  }, [companyId, bankAccountOrchestrator]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !companyId) return;
      setLoading(true);
      try {
        // 1. Fetch user info
        console.log("auth uid", userId);
        const userRes = await userOrchestrator.getUserById({ id: userId });
        if (userRes.ok && userRes.value) {
          setTargetUser(userRes.value);
        }

        // 2. Fetch existing roster definition
        const rosterRes = await rosterOrchestrator.getRosterByUser({ companyId, userId });
        if (rosterRes.ok && rosterRes.value.roster) {
          const r = rosterRes.value.roster;
          reset({
            periodicity: r.periodicity,
            startDate: r.startDate,
            salary: r.salary,
          });
        }
      } catch (error) {
        console.error("Error fetching roster details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, companyId, rosterOrchestrator, userOrchestrator, reset]);

  const onSubmit = async (values: RosterFormValues) => {
    if (!companyId || !userId) return;

    setSaving(true);
    try {
      const result = await rosterOrchestrator.saveRoster({
        companyId,
        roster: {
          id: userId,
          userId: userId,
          companyId,
          ...values,
        },
      });

      if (result.ok) {
        setDialog({
          open: true,
          message: "Definición de nómina guardada correctamente.",
          success: true,
        });
      } else {
        setDialog({
          open: true,
          message: "Error al guardar la definición de nómina.",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error saving roster:", error);
      setDialog({ open: true, message: "Error inesperado al guardar.", success: false });
    }
  };

  const handleRegisterPayment = async () => {
    if (!companyId || !userId) return;

    setSaving(true);
    try {
      const result = await payrollOrchestrator.registerPayment({
        companyId,
        userId,
        amount: Number(paymentAmount),
        method: paymentMethod,
        bankAccountId: paymentMethod === "consignacion" ? selectedBankId : undefined,
        file: proofFile || undefined,
      });

      if (result.ok) {
        setPaymentDialogOpen(false);
        setDialog({
          open: true,
          message: "Pago de nómina registrado correctamente.",
          success: false, // Don't redirect
        });
        setProofFile(null);
      } else {
        setDialog({
          open: true,
          message: "Error al registrar el pago de nómina.",
          success: false,
        });
      }
    } catch (error) {
      console.error("Error registering payment:", error);
      setDialog({ open: true, message: "Error inesperado al registrar pago.", success: false });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  if (!targetUser) {
    return (
      <Box p={3}>
        <Typography color="error">Usuario no encontrado.</Typography>
        <Button onClick={() => navigate(ScreenPaths.accountant.rosterUsers)}>Volver</Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={1} fontWeight="bold" color="primary">
        Definir Nómina
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Configuración salarial para: <strong>{targetUser.name}</strong> ({targetUser.email})
      </Typography>

      <Box maxWidth={600}>
        <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4} component="form" onSubmit={handleSubmit(onSubmit)}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Periodicidad de Pago
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Periodicidad</InputLabel>
                  <Controller
                    name="periodicity"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Periodicidad">
                        <MenuItem value="mensual">Mensual</MenuItem>
                        <MenuItem value="quincenal">Quincenal</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Fecha de Inicio de Pago
                </Typography>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: "La fecha es obligatoria" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Monto a Pagar (Salario)
                </Typography>
                <MoneyField
                  name="salary"
                  control={control}
                  label="Salario / Monto"
                  rules={{
                    required: "El monto es obligatorio",
                    min: { value: 1, message: "Debe ser mayor a 0" },
                  }}
                />
              </Box>

              <Stack direction="row" spacing={2} pt={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(ScreenPaths.accountant.rosterUsers)}
                  disabled={saving}
                  sx={{ borderRadius: 2 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={saving}
                  sx={{ borderRadius: 2, fontWeight: "bold" }}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : "Guardar Definición"}
                </Button>
              </Stack>

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                size="large"
                onClick={() => setPaymentDialogOpen(true)}
                disabled={loading || saving}
                sx={{ borderRadius: 2, fontWeight: "bold" }}
              >
                Registrar Pago
              </Button>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                size="large"
                onClick={() => navigate(ScreenPaths.accountant.payrollHistory(userId!))}
                disabled={loading || saving}
                sx={{ borderRadius: 2, fontWeight: "bold" }}
              >
                Ver registro de pagos
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => !saving && setPaymentDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Registrar Pago de Nómina</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Monto a Pagar"
              type="number"
              fullWidth
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(FormatNumberToMoney(Number(e.target.value)))}
              InputProps={{ inputProps: { min: 0 } }}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Método de Pago</FormLabel>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PayrollPaymentMethod)}
              >
                <FormControlLabel value="efectivo" control={<Radio />} label="Efectivo" />
                <FormControlLabel value="consignacion" control={<Radio />} label="Consignación" />
              </RadioGroup>
            </FormControl>

            {paymentMethod === "consignacion" && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Cuenta Bancaria (Opcional)</InputLabel>
                  <Select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    label="Cuenta Bancaria (Opcional)"
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {bankAccounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Comprobante (Opcional)
                  </Typography>
                  {!proofFile ? (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                    >
                      Subir Comprobante
                      <input type="file" hidden accept="image/*,application/pdf" onChange={handleFileChange} />
                    </Button>
                  ) : (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {proofFile.name}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => setProofFile(null)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleRegisterPayment}
            variant="contained"
            disabled={saving || Number(paymentAmount) <= 0}
          >
            {saving ? <CircularProgress size={24} /> : "Registrar Pago"}
          </Button>
        </DialogActions>
      </Dialog>

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        onClick={() => {
          setDialog({ ...dialog, open: false });
          if (dialog.success) navigate(ScreenPaths.accountant.rosterUsers);
        }}
        butonText="Aceptar"
      />
    </Box>
  );
};

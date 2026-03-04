import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
import {
  cloneInstallment,
  type Installment,
} from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import { BaseDialog } from "../../atoms/BaseDialog";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PaymentOrchestrator from "../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import {
  type Payment,
  type GeoLocation,
  type PaymentMethod,
} from "../../../features/debits/domain/business/entities/Payment";
import { useForm, Controller } from "react-hook-form";
import { getCurrentLocation } from "../../../features/shared/helpers/geoLocation";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BankAccountOrchestrator from "../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../features/bankAccounts/domain/business/entities/BankAccount";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";

interface PartialPaymentForm {
  amount: number;
}

export const InstallmentDetailScreen = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBody, setDialogBody] = useState("");
  const [dialogTitle, setDialogTitle] = useState<string | undefined>(undefined);
  const dispatch = useAppDispatch();
  const { id: installmentId } = useParams<{ id: string }>();

  const user = useAppSelector((state) => state.user.user);
  const collectorId: string = user?.id ?? "";
  const companyId: string = user?.companyId ?? "";

  const [loading, setLoading] = useState(false);

  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] =
    useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    type: "full" | "partial";
    amount?: number;
    method?: PaymentMethod;
    file?: File | null;
  } | null>(null);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");

  const bankAccountOrchestrator = useMemo(() => new BankAccountOrchestrator(), []);

  const emptyInstallment: Installment = {
    id: "",
    debtId: "",
    companyId: "",
    installmentTotalNumber: 0,
    lateDueDate: "",
    lateInterestRate: 0,
    aplazado: false,
    latepayment: 0,
    payments: [],
    paidAmount: 0,
    paidAt: "",
    interestRate: 0,
    collectorId: "",
    costumerId: "",
    costumerDocument: "",
    costumerName: "",
    costumerNumber: "123213321321",
    costumerAddres: {
      address: "",
      neighborhood: "",
      stratum: 1,
      city: "",
    },
    installmentNumber: 1,
    amount: 0,
    dueDate: new Date().toISOString().split("T")[0], // Fecha de hoy por defecto
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };
  const [installment, setInstallment] = useState<Installment>(emptyInstallment);

  const paymentOrchestrator = useMemo(() => new PaymentOrchestrator(), []);
  const installmentsOrchestrator = useMemo(
    () => new InstallmentsOrchestrator(),
    [],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PartialPaymentForm>({
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    const loadBankAccounts = async () => {
      if (companyId) {
        const result = await bankAccountOrchestrator.getAll({ companyId });
        if (result.ok) {
          setBankAccounts(result.value.bankAccounts);
        }
      }
    };
    loadBankAccounts();
  }, [companyId, bankAccountOrchestrator]);

  useEffect(() => {
    if (!installmentId) {
      return;
    }
    const fetchInstallment = async () => {
      try {
        setLoading(true);
        // Using memoized instance
        // const installmentsOrchestrator = new InstallmentsOrchestrator();

        const result = await installmentsOrchestrator.getById({
          companyId: companyId,
          collectorId: collectorId,
          installmentId: installmentId,
        });

        if (result.ok) {
          console.log(result.value.state);
          setInstallment(result.value.state);
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        console.error("Error cargando cuotas:", error);
      }
    };
    fetchInstallment();
  }, [installmentId, companyId, collectorId, installmentsOrchestrator]);

  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("efectivo");
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Helper to create basic payment object
  const createPaymentObject = (
    amount: number,
    location?: GeoLocation,
    paymentId?: string,
    proofUrl?: string,
    method: PaymentMethod = "efectivo",
    bankAccountId?: string,
  ): Payment => {
    return {
      id: paymentId || "",
      idProofOfPayment: proofUrl || "",
      collectorObservation: "",
      accountantObservation: "",
      installmentId: installment.id,
      costumerName: installment.costumerName,
      collectorName: user?.name || "Desconocido",
      collectorId: collectorId,
      amount: amount,
      method: method,
      status: "registrado",
      paidAt: new Date().toISOString(),
      location: location,
      bankAccountId: bankAccountId,
    };
  };

  const processPayment = async (
    amount: number,
    location?: GeoLocation,
    paymentId?: string,
    proofUrl?: string,
    method: PaymentMethod = "efectivo",
  ) => {
    if (!installmentId) return;

    try {
      setLoading(true);

      // 1. Validate Bank Account Limit if Consignment
      if (method === "consignacion") {
        const selectedAccount = bankAccounts.find(a => a.id === selectedBankAccountId);
        if (!selectedAccount) {
          throw new Error("No se seleccionó una cuenta bancaria.");
        }

        const newMonto = selectedAccount.monto + amount;
        if (newMonto > selectedAccount.tope) {
          setDialogTitle("Tope Excedido");
          setDialogBody(
            `El registro no se puede hacer en la cuenta "${selectedAccount.name}" ya que viola el tope asignado de $ ${selectedAccount.tope.toLocaleString()}.`
          );
          setDialogOpen(true);
          setLoading(false);
          return;
        }

        // Update Bank Account amount
        const updateResult = await bankAccountOrchestrator.update({
          companyId,
          bankAccount: { ...selectedAccount, monto: newMonto }
        });

        if (!updateResult.ok) {
          throw new Error("Error al actualizar el saldo de la cuenta bancaria.");
        }
      }

      // 2. Update Collector Balance if Cash
      if (method === "efectivo" && user) {
        const userOrchestrator = new UserOrchestrator(dispatch);
        const newTotalAmount = (user.totalAmount || 0) + amount;
        const userUpdateResult = await userOrchestrator.updateTotalAmount({
          userId: user.id,
          companyId: user.companyId,
          newAmount: newTotalAmount
        });

        if (!userUpdateResult.ok) {
          console.error("Error updating user total amount", userUpdateResult.error);
          // Non-blocking but worthy of a log
        }
      }

      // 3. Create Payment
      const payment = createPaymentObject(
        amount,
        location,
        paymentId,
        proofUrl,
        method,
        method === "consignacion" ? selectedBankAccountId : undefined,
      );
      const paymentResult = await paymentOrchestrator.createPayment({
        payment,
        companyId,
      });

      if (!paymentResult.ok) {
        throw new Error("Error creating payment");
      }

      // 2. Update Installment
      const cache = cloneInstallment(installment);
      const newPaidAmount = (cache.paidAmount || 0) + amount;

      if (newPaidAmount >= cache.amount) {
        cache.status = "pagada";
        cache.paidAt = new Date().toISOString().split("T")[0];
      } else {
        cache.status = "incompleto";
      }
      cache.paidAmount = newPaidAmount;

      const createdPaymentId = paymentResult.value.payment.id;
      cache.payments = [...(cache.payments || []), createdPaymentId];

      const result = await installmentsOrchestrator.updateById({
        companyId,
        installment: cache,
      });

      if (result.ok) {
        setInstallment(cache);
        if (cache.status === "pagada") {
          setDialogTitle("Pago Registrado");
          setDialogBody("El pago completo fue registrado correctamente.");
        } else {
          setDialogTitle("Abono Registrado");
          setDialogBody(`Se registró un abono de $${amount.toLocaleString()}.`);
        }
      } else {
        // ROLLBACK
        console.error(
          "Error updating installment, rolling back payment:",
          createdPaymentId,
        );
        await paymentOrchestrator.deletePayment({
          companyId,
          paymentId: createdPaymentId,
        });

        setDialogTitle("Error");
        setDialogBody(
          "No se pudo actualizar la cuota. La transacción ha sido cancelada.",
        );
      }
    } catch (error) {
      console.error(error);
      setDialogTitle("Error");
      setDialogBody("Ocurrió un error al procesar el pago.");
    } finally {
      setLoading(false);
      setDialogOpen(true);
      setPendingPayment(null);
      setProofFile(null);
    }
  };

  const executePaymentFlow = async (
    amount: number,
    method: PaymentMethod,
    file?: File | null,
    forceLocationData?: GeoLocation | null,
  ) => {
    setLoading(true);

    let location = forceLocationData;

    // Only attempt to get location if not provided (e.g. from confirmation dialog)
    // AND strictly if we haven't already failed getting it.
    // Simplify: Always try get location if not checking existing failure.
    // Actually, if we are here from "Registrar sin ubicación", forceLocationData is null/undefined intentionally.

    if (location === undefined) {
      try {
        location = await getCurrentLocation();
      } catch (error) {
        console.warn("Could not get location:", error);
        // Save state and show dialog
        setPendingPayment({ type: "partial", amount, method, file }); // 'type' is redundant strictly but needed for compatibility if I kept it
        setLocationDialogOpen(true);
        setLoading(false);
        return;
      }
    }

    // If Consignment, Upload Proof
    let generatedId: string | undefined;
    let proofUrl: string | undefined;

    if (method === "consignacion") {
      if (!file) {
        setLoading(false);
        setDialogTitle("Error");
        setDialogBody(
          "Debe adjuntar un comprobante para pagos por consignación.",
        );
        setDialogOpen(true);
        return;
      }

      try {
        generatedId = paymentOrchestrator.generatePaymentId(companyId);
        const uploadResult = await paymentOrchestrator.uploadProof({
          file,
          companyId,
          paymentId: generatedId,
        });

        if (!uploadResult.ok) {
          throw new Error("Upload Failed");
        }
        proofUrl = uploadResult.value;
      } catch (error) {
        console.error("Upload error", error);
        setLoading(false);
        setDialogTitle("Error");
        setDialogBody(
          "No se puede registrar el pago como consignación por el momento. Inténtelo más tarde o comuníquese con un asesor.",
        );
        setDialogOpen(true);
        setProofFile(null);
        return;
      }
    }

    await processPayment(
      amount,
      location || undefined,
      generatedId,
      proofUrl,
      method,
    );
  };

  const initiatePayment = (type: "full" | "partial", amount: number) => {
    // Open Method Dialog
    setPendingPayment({ type, amount });
    setPaymentMethodDialogOpen(true);
  };

  const handlePaymentMethodConfirm = () => {
    if (!pendingPayment?.amount) return;
    setPaymentMethodDialogOpen(false);

    executePaymentFlow(pendingPayment.amount, selectedMethod, proofFile);
  };

  const handleLocationDialogResponse = (confirm: boolean) => {
    setLocationDialogOpen(false);
    if (confirm && pendingPayment && pendingPayment.amount) {
      // User accepted to proceed without location
      // pendingPayment now has extra fields from our hack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { amount, method, file } = pendingPayment as any;
      executePaymentFlow(amount, method || "efectivo", file, null); // Pass null as location to skip retry
    } else {
      setPendingPayment(null);
      setProofFile(null);
    }
  };

  const handleFullPayment = () => {
    if (!installmentId) return;
    const amountToPay = installment.amount - (installment.paidAmount || 0);
    initiatePayment("full", amountToPay);
  };

  const onPartialPaymentSubmit = (data: PartialPaymentForm) => {
    setPartialPaymentDialogOpen(false);
    reset();
    initiatePayment("partial", Number(data.amount));
  };

  if (!installment) {
    return <Typography>No se encontró la cuota</Typography>;
  }
  const canBePaid =
    installment.status === "pendiente" || installment.status === "incompleto";

  if (loading && !installment.id && !loading) {
    // Corrected logic: loading is state, but we also check if installment is loaded
    return (
      <Box
        height="70vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Calculate max amount for partial payment
  const maxPaymentAmount = installment.amount - (installment.paidAmount || 0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProofFile(event.target.files[0]);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "pendiente") return "error";
    if (status === "incompleto") return "warning";
    return "success";
  };

  return (
    <Box p={2}>
      <BaseDialog
        open={dialogOpen}
        title={dialogTitle}
        body={dialogBody}
        butonText="Aceptar"
        onClick={() => setDialogOpen(false)}
      />

      {/* LOCATION DIALOG */}
      <Dialog
        open={locationDialogOpen}
        onClose={() => handleLocationDialogResponse(false)}
      >
        <DialogTitle>Ubicación no disponible</DialogTitle>
        <DialogContent>
          <Typography>
            No se pudo obtener su ubicación actual. ¿Desea registrar el pago de
            todas formas?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleLocationDialogResponse(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleLocationDialogResponse(true)}
            variant="contained"
            autoFocus
          >
            Registrar sin ubicación
          </Button>
        </DialogActions>
      </Dialog>

      {/* PAYMENT METHOD DIALOG */}
      <Dialog
        open={paymentMethodDialogOpen}
        onClose={() => setPaymentMethodDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Método de Pago</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">Seleccione el método</FormLabel>
            <RadioGroup
              value={selectedMethod}
              onChange={(e) =>
                setSelectedMethod(e.target.value as PaymentMethod)
              }
            >
              <FormControlLabel
                value="efectivo"
                control={<Radio />}
                label="Efectivo"
              />
              <FormControlLabel
                value="consignacion"
                control={<Radio />}
                label="Consignación"
              />
            </RadioGroup>
          </FormControl>

          {selectedMethod === "consignacion" && (
            <Box mt={2}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="bank-account-label">Cuenta Bancaria</InputLabel>
                <Select
                  labelId="bank-account-label"
                  value={selectedBankAccountId}
                  label="Cuenta Bancaria"
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                >
                  {bankAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.bankName} - {account.name} (Tope: ${account.tope.toLocaleString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 1 }}
              >
                {proofFile ? proofFile.name : "Subir Comprobante"}
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </Button>
              {!proofFile && (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  mt={1}
                >
                  * Comprobante requerido
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentMethodDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePaymentMethodConfirm}
            variant="contained"
            disabled={(selectedMethod === "consignacion" && (!proofFile || !selectedBankAccountId))}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOGO PAGO PARCIAL */}
      <Dialog
        open={partialPaymentDialogOpen}
        onClose={() => setPartialPaymentDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Registrar Pago Parcial</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Typography variant="body2" gutterBottom>
              Monto pendiente: ${maxPaymentAmount.toLocaleString()}
            </Typography>
            <form
              id="partial-payment-form"
              onSubmit={handleSubmit(onPartialPaymentSubmit)}
            >
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: "El monto es obligatorio",
                  min: { value: 1, message: "El monto debe ser mayor a 0" },
                  max: {
                    value: maxPaymentAmount,
                    message: `El monto no puede superar $${maxPaymentAmount.toLocaleString()}`,
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Monto a pagar"
                    type="number"
                    fullWidth
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    autoFocus
                  />
                )}
              />
            </form>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartialPaymentDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="partial-payment-form" variant="contained">
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h5" mb={2}>
        Detalle de la cuota
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* ESTADO */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={installment.status.replace("_", " ")}
                color={getStatusColor(installment.status)}
              />

              {installment.paidAmount && installment.paidAmount > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Pagado: ${installment.paidAmount.toLocaleString()} / $
                  {installment.amount.toLocaleString()}
                </Typography>
              ) : null}
            </Stack>

            {/* CLIENTE */}
            <Box>
              <Typography fontWeight="bold">
                {installment.costumerName}
              </Typography>
              <Typography variant="body2">
                📄 {installment.costumerDocument}
              </Typography>
            </Box>

            {/* DIRECCIÓN */}
            <Box>
              <Typography variant="subtitle2">Dirección</Typography>
              <Typography variant="body2">
                📍 {installment.costumerAddres.address}
              </Typography>
              <Typography variant="body2">
                {installment.costumerAddres.neighborhood} –{" "}
                {installment.costumerAddres.city}
              </Typography>
            </Box>

            {/* CONTACTO */}
            {installment.costumerNumber && (
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  Contactar cliente
                </Typography>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PhoneIcon />}
                    onClick={() =>
                      openPhoneCall(
                        getPhoneWithCountryCode(installment.costumerNumber),
                      )
                    }
                  >
                    Llamar
                  </Button>

                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<WhatsAppIcon />}
                    onClick={() =>
                      openWhatsApp(
                        getPhoneWithCountryCode(installment.costumerNumber),
                      )
                    }
                  >
                    WhatsApp
                  </Button>
                </Stack>
              </Box>
            )}

            <Divider />

            {/* INFO CUOTA */}
            <Box>
              <Typography variant="body2">
                Cuota {installment.installmentNumber}
              </Typography>
              <Typography variant="h6">
                ${installment.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Vence: {new Date(installment.dueDate).toLocaleDateString()}
              </Typography>
            </Box>

            {/* ACCIÓN */}
            {canBePaid && (
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={loading}
                  onClick={handleFullPayment}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Procesando..." : "Pago Completo"}
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  disabled={loading}
                  onClick={() => {
                    reset({ amount: 0 }); // Reset form with 0 or empty
                    setPartialPaymentDialogOpen(true);
                  }}
                >
                  Pago Parcial
                </Button>
              </Stack>
            )}

            {!canBePaid && (
              <Typography color="text.secondary">
                Esta cuota ya no puede ser modificada
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

const getPhoneWithCountryCode = (phone?: string) => {
  if (!phone) return "";
  // Limpia espacios y caracteres raros
  const clean = phone.replaceAll(/\D/g, "");
  return `57${clean}`;
};

const openPhoneCall = (phone: string) => {
  window.open(`tel:+${phone}`, "_self");
};

const openWhatsApp = (phone: string) => {
  window.open(`https://wa.me/${phone}`, "_blank");
};

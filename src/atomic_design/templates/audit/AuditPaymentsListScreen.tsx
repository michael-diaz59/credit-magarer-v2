import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import type { Payment } from "../../../features/debits/domain/business/entities/Payment";
import { useAppSelector } from "../../../store/redux/coreRedux";
import PaymentOrchestrator from "../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
} from "@mui/material";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import { BaseDialog } from "../../atoms/BaseDialog";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import { calculateDebtFinancialsSimple } from "../../../features/debits/domain/business/useCases/helper";

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const statusColorMap: Record<
  Payment["status"],
  "default" | "success" | "warning" | "error"
> = {
  registrado: "warning",
  conflicto: "error",
  confirmado: "success",
  cancelada: "default",
};

export const PaymentsListScreen = () => {

  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user.user);
  const companyId = user?.companyId ?? "";
  const { idInstallment } = useParams<{ idInstallment: string }>();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);

  // Deferral Dialog State
  const [deferDialogOpen, setDeferDialogOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [newInterestRate, setNewInterestRate] = useState<number>(0);
  const [deferError, setDeferError] = useState("");
  const [updating, setUpdating] = useState(false);

  // Result Dialog State
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    if (!companyId || !idInstallment) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const paymentOrchestrator = new PaymentOrchestrator();
        const installmentOrchestrator = new InstallmentsOrchestrator();

        const [paymentResult, installmentResult] = await Promise.all([
          paymentOrchestrator.getByInstallment({
            companyId,
            installmentId: idInstallment,
          }),
          installmentOrchestrator.getById({
            companyId,
            installmentId: idInstallment,
          }),
        ]);

        if (paymentResult.state.ok) {
          setPayments(paymentResult.state.value);
        }

        if (installmentResult.ok) {
          const inst = installmentResult.value.state;
          setInstallment(inst);
          setNewInterestRate(inst.interestRate);
          setNewDueDate(inst.dueDate);

          // Fetch all installments for this debt to check renewable status
          const allInstResult = await installmentOrchestrator.getByDebt({
            companyId,
            debtId: inst.debtId,
          });

          if (allInstResult.state.ok) {
            setAllInstallments(allInstResult.state.value);
          }
        }
      } catch (error) {
        console.error("Error cargando datos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, idInstallment, user?.id]);


  const handleDefer = async () => {
    if (!installment || !companyId) return;

    if (new Date(newDueDate) <= new Date(installment.dueDate)) {
      setDeferError("La nueva fecha debe ser posterior a la original.");
      return;
    }

    if (newInterestRate < installment.interestRate) {
      setDeferError("La nueva tasa de interés debe ser mayor a la original.");
      return;
    }

    try {
      setUpdating(true);
      setDeferError("");

      const originalDate = normalizeDate(parseLocalDate(installment.dueDate));
      const nextDate = normalizeDate(parseLocalDate(newDueDate));
      const diffTime = Math.abs(nextDate.getTime() - originalDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


      const debtOrchestrator = new DebtOrchestrator()

      const getDebitById = await debtOrchestrator.getDebitById({ idDebt: installment.debtId, companyId: companyId })

      let debt: Debt
      if (getDebitById.state.ok && getDebitById.state.value) {
        debt = getDebitById.state.value
      } else {
        setResultMessage("error al cargar la deuda asignada a esta cuota, no se realizaron cambios");
        setResultDialogOpen(true);
        return
      }

      // Cálculo de nuevo monto: Interés proporcional basado en 24 días (al ser aplazada)
      console.log("dias de atraso:", diffDays)

      const newDebt = calculateDebtFinancialsSimple({
        debtTerms: debt.debtTerms,
        diasMes: debt.diasMes,
        installmentCount: debt.installmentCount,
        interestRate: newInterestRate,
        totalAmount: debt.totalAmount,
        delayDays: diffDays
      })


      const updatedInstallment: Installment = {
        ...installment,
        lateDueDate: newDueDate,
        lateInterestRate: newInterestRate,
        latepayment: newDebt.pagoCuota,
        aplazado: true,
      };

      const orchestrator = new InstallmentsOrchestrator();
      const result = await orchestrator.updateById({
        companyId,
        installment: updatedInstallment,
      });

      if (result.ok) {
        setInstallment(updatedInstallment);
        setDeferDialogOpen(false);
        setResultMessage("Cuota aplazada con éxito.");
        setResultDialogOpen(true);
      } else {
        setDeferError("Error al actualizar la cuota.");
      }
    } catch (error) {
      console.error("Error al aplazar deuda", error);
      setDeferError("Ocurrió un error inesperado.");
    } finally {
      setUpdating(false);
    }
  };

  const isRenewable =
    allInstallments.length > 0 &&
    allInstallments.filter((i) => i.status === "liquidada" || i.status === "pagada")
      .length >=
    allInstallments.length / 2;

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <BaseDialog
        open={resultDialogOpen}
        body={resultMessage}
        onClick={() => setResultDialogOpen(false)}
        butonText="Aceptar"
      />

      <Dialog
        open={deferDialogOpen}
        onClose={() => !updating && setDeferDialogOpen(false)}
      >
        <DialogTitle>Aplazar Deuda</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {deferError && <Alert severity="error">{deferError}</Alert>}
            <TextField
              label="Nueva fecha de pago"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <TextField
              label="Nueva tasa de interés (%)"
              type="number"
              fullWidth
              value={newInterestRate}
              onChange={(e) => setNewInterestRate(Number(e.target.value))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeferDialogOpen(false)} disabled={updating}>
            Cancelar
          </Button>
          <Button onClick={handleDefer} variant="contained" disabled={updating}>
            {updating ? <CircularProgress size={24} /> : "Actualizar cuota"}
          </Button>
        </DialogActions>
      </Dialog>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">Pagos registrados</Typography>
          {isRenewable && (
            <Chip
              label="Cliente Renovable"
              color="success"
              variant="filled"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
                color: "white",
                boxShadow: "0 3px 5px 2px rgba(46, 125, 50, .3)",
              }}
            />
          )}
        </Stack>
        <Button
          variant="contained"
          onClick={() => setDeferDialogOpen(true)}
          disabled={!installment}
        >
          Aplazar deuda
        </Button>
      </Stack>

      <Stack spacing={2}>
        {payments.map((payment) => (
          <Box
            key={payment.id}
            p={2}
            border="1px solid"
            borderColor="divider"
            borderRadius={2}
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "action.hover" },
            }}
            onClick={() =>
              navigate(ScreenPaths.auditor.payment(payment.id ?? ""))
            }
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography fontWeight={500}>
                {payment.costumerName} — ${payment.amount}
              </Typography>

              <Chip
                label={payment.status}
                size="small"
                color={statusColorMap[payment.status]}
              />
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body2" color="text.secondary">
              Cobrador: {payment.collectorName}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Método: {payment.method} · Fecha: {payment.paidAt}
            </Typography>
          </Box>
        ))}

        {payments.length === 0 && (
          <Typography color="text.secondary">
            No hay pagos registrados.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

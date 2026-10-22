import { Box, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import { ScreenPaths } from "../../core/helpers/name_routes";
import { isInstallmentLate } from "../sub_atomic_particles/installmentStatus";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";
import { calculateInstallmentArrears } from "../../features/debits/domain/business/services/calculateInstallmentArrears";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";

type Props = {
  installment: Installment;
  debt?: Debt | null;
};

const statusColorMap: Record<
  Installment["status"],
  "default" | "success" | "warning" | "error"
> = {
  pendiente: "warning",
  negociada: "success",
  pagada: "success",
  renovada: "success",
  inactivo: "success",
  adelantada: "success",
};

export const InstallmentItem = ({ installment, debt }: Props) => {
  const navigate = useNavigate();

  const arrearsInfo = calculateInstallmentArrears({
    installment,
    debt,
  });

  const isLate = arrearsInfo.delayDays > 0 || isInstallmentLate(installment);

  const chipColor = isLate
    ? "error"
    : statusColorMap[installment.status];

  const chipLabel = isLate
    ? "en_mora"
    : installment.status;

  const isPaid =
    installment.status === "pagada" ||
    (installment.outstandingReceivables !== undefined && installment.outstandingReceivables <= 0);

  const basePending = isPaid
    ? 0
    : Math.max(0, (installment.amount ?? 0) - (installment.amountPaid ?? 0));

  const capitalPending = isPaid
    ? 0
    : (installment.remainingCapitalToPay > 0
        ? installment.remainingCapitalToPay
        : Math.max(0, (installment.capital ?? 0) - (installment.capitalPaid ?? 0)));

  const interestPending = isPaid
    ? 0
    : (installment.remainingInterestToPay > 0
        ? installment.remainingInterestToPay
        : Math.max(0, (installment.interest ?? 0) - (installment.interestPaid ?? 0)));

  const totalRemainingToPay = isPaid
    ? 0
    : Math.round(basePending + arrearsInfo.pendingArrears + arrearsInfo.pendingDeferment);

  return (
    <Box
      p={2}
      border="1px solid"
      borderColor={isLate ? "error.main" : "divider"}
      borderRadius={2}
      sx={{
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
      onClick={() =>
        navigate(ScreenPaths.auditor.payments(installment.id))
      }
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography fontWeight={600}>
          Cuota #{installment.installmentNumber} — ${FormatNumberToMoney(installment.total || installment.amount)}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {arrearsInfo.delayDays > 0 && (
            <Chip
              label={`${arrearsInfo.delayDays} d de mora`}
              color="error"
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            label={chipLabel}
            color={chipColor}
            size="small"
          />
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Vence: {formatISOToInputDate(installment.dueDate)}
      </Typography>

      {installment.defermentDueDate && (
        <Typography variant="body2" color="text.secondary">
          Aplazada hasta: {formatISOToInputDate(installment.defermentDueDate)}
        </Typography>
      )}

      {installment.paidAt && (
        <Typography variant="body2" color="text.secondary">
          Pagada el: {formatISOToInputDate(installment.paidAt)}
        </Typography>
      )}

      <Box
        mt={1.5}
        p={1.5}
        borderRadius={1}
        sx={{
          bgcolor: isLate ? "rgba(211, 47, 47, 0.04)" : "grey.50",
          border: "1px dashed",
          borderColor: isLate ? "error.light" : "divider",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="body2" fontWeight={700} color={isPaid ? "success.main" : "text.primary"}>
            Valor restante por cobrar: ${FormatNumberToMoney(totalRemainingToPay)}
          </Typography>

          {/* Desglose de Capital e Interés */}
          <Box sx={{ pl: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              Desglose de Cuota (Capital e Interés)
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 4 }} mt={0.5}>
              <Box>
                <Typography variant="body2">
                  🏦 <strong>Capital:</strong> ${FormatNumberToMoney(installment.capital)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • Pagado: <strong>${FormatNumberToMoney(installment.capitalPaid ?? 0)}</strong> | Pendiente: <strong style={{ color: capitalPending > 0 ? "#d32f2f" : "#2e7d32" }}>${FormatNumberToMoney(capitalPending)}</strong>
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2">
                  📈 <strong>Interés:</strong> ${FormatNumberToMoney(installment.interest)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • Pagado: <strong>${FormatNumberToMoney(installment.interestPaid ?? 0)}</strong> | Pendiente: <strong style={{ color: interestPending > 0 ? "#d32f2f" : "#2e7d32" }}>${FormatNumberToMoney(interestPending)}</strong>
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Desglose de Moras si aplican */}
          {(arrearsInfo.pendingArrears > 0 || arrearsInfo.pendingDeferment > 0 || (installment.arrearsPaid ?? 0) > 0 || (installment.defermentPaid ?? 0) > 0) && (
            <Box sx={{ pl: 0.5, pt: 0.5, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Mora y Aplazamiento
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 3 }} mt={0.5}>
                <Typography variant="caption" color={arrearsInfo.pendingArrears > 0 ? "error.main" : "text.secondary"}>
                  • Mora retraso (arrears): <strong>${FormatNumberToMoney(arrearsInfo.pendingArrears)}</strong>
                  {(installment.arrearsPaid ?? 0) > 0 && ` (pagado: $${FormatNumberToMoney(installment.arrearsPaid)})`}
                </Typography>
                <Typography variant="caption" color={arrearsInfo.pendingDeferment > 0 ? "warning.main" : "text.secondary"}>
                  • Mora aplazamiento (deferment): <strong>${FormatNumberToMoney(arrearsInfo.pendingDeferment)}</strong>
                  {(installment.defermentPaid ?? 0) > 0 && ` (pagado: $${FormatNumberToMoney(installment.defermentPaid)})`}
                </Typography>
              </Stack>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5, borderTop: "1px dashed", borderColor: "divider" }}>
            Total abonado a la cuota: <strong>${FormatNumberToMoney(installment.totalPaid ?? installment.amountPaid ?? 0)}</strong>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};
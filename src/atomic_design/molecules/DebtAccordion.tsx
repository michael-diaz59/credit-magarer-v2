import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import { calculateInstallmentArrears } from "../../features/debits/domain/business/services/calculateInstallmentArrears";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";
import InstallmentsOrchestrator from "../../features/debits/domain/infraestructure/installmentsOrchestrator";

export interface DebtAccordionProps {
  debtId: string;
  debtName: string;
  debt?: Debt | null;
  pending: Installment[];
  overdue: Installment[];
  expanded?: boolean;
  isCollectedView?: boolean;
  onChange?: (isExpanded: boolean) => void;
  onClick: (installment: Installment) => void;
}

export const DebtAccordion = ({
  debtId,
  debtName,
  debt,
  pending,
  overdue,
  isCollectedView = false,
  onClick,
}: DebtAccordionProps) => {
  const allItems = useMemo(() => [...overdue, ...pending], [overdue, pending]);
  const totalCount = allItems.length;
  const overdueCount = overdue.length;
  const pendingCount = pending.length;

  // Ordenar para identificar la cuota más vieja (menor installmentNumber / fecha más antigua)
  const sortedInstallments = useMemo(() => {
    return [...allItems].sort((a, b) => {
      const numA = a.installmentNumber ?? 0;
      const numB = b.installmentNumber ?? 0;
      if (numA !== numB) {
        return numA - numB;
      }
      const dateA = a.paymentDate || a.dueDate || "";
      const dateB = b.paymentDate || b.dueDate || "";
      return dateA.localeCompare(dateB);
    });
  }, [allItems]);

  // Cuota más vieja para registrar pagos de forma prioritaria
  const oldestInstallment = sortedInstallments[0];

  // Cálculo financiero detallado del crédito
  const financialSummary = useMemo(() => {
    let totalBaseAmount = 0;       // Suma del amount de las cuotas pendientes
    let totalDelayArrears = 0;     // Mora acumulada por retraso
    let totalDefermentArrears = 0; // Mora acumulada por aplazamiento
    let totalPaidAmount = 0;

    for (const inst of allItems) {
      if (isCollectedView) {
        totalPaidAmount += (inst.totalPaid ?? inst.amountPaid ?? inst.amount ?? 0);
        continue;
      }

      const base = inst.outstandingReceivablesAmount ?? inst.amount ?? 0;
      const arrearsInfo = calculateInstallmentArrears({ installment: inst, debt });

      totalBaseAmount += base;
      totalDelayArrears += arrearsInfo.pendingArrears;
      totalDefermentArrears += arrearsInfo.pendingDeferment;
    }

    const totalCreditAmount = totalBaseAmount + totalDelayArrears + totalDefermentArrears;

    return {
      totalBaseAmount,
      totalDelayArrears,
      totalDefermentArrears,
      totalCreditAmount,
      totalPaidAmount,
    };
  }, [allItems, debt, isCollectedView]);

  // 1. Número máximo de cuota entre las que están en mora o se cobran hoy
  const maxDueNumber = useMemo(() => {
    if (allItems.length === 0) {
      return debt?.installmentsPaid ?? 0;
    }
    return Math.max(...allItems.map((i) => i.installmentNumber ?? 0));
  }, [allItems, debt?.installmentsPaid]);

  const totalInstallmentsCount = useMemo(() => {
    return (
      debt?.installmentCount ??
      (allItems[0]?.installmentTotalNumber ?? 0)
    );
  }, [debt, allItems]);

  // 2. ¿Quedan más cuotas a parte de las que están en mora o se cobran hoy?
  const hasRemainingInstallments =
    totalInstallmentsCount > 0 ? maxDueNumber < totalInstallmentsCount : false;
  const targetNextInstallmentNumber = hasRemainingInstallments ? maxDueNumber + 1 : null;

  const [nextInstallment, setNextInstallment] = useState<Installment | null>(null);

  useEffect(() => {
    if (!hasRemainingInstallments || !targetNextInstallmentNumber) {
      setNextInstallment(null);
      return;
    }

    const companyId = allItems[0]?.companyId;
    if (!companyId || !debtId) return;

    let isMounted = true;
    const orchestrator = new InstallmentsOrchestrator();

    orchestrator
      .getByDebtAndNumber({
        companyId,
        debtId,
        installmentNumber: targetNextInstallmentNumber,
      })
      .then((res) => {
        if (isMounted && res.ok && res.value.installment) {
          setNextInstallment(res.value.installment);
        }
      })
      .catch((err: unknown) => {
        console.error("Error al traer cuota siguiente:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [hasRemainingInstallments, targetNextInstallmentNumber, debtId, allItems]);

  // Simulación del valor real restante para liquidar el crédito completo
  const liquidationSimulation = useMemo(() => {
    if (!debt) return null;

    // Capital restante por pagar del crédito completo
    const remainingCapital = debt.remainingCapitalToPay ?? 0;

    // Helper para obtener el interés pendiente de una cuota
    const getInstallmentPendingInterest = (inst: Installment): number => {
      if (typeof inst.remainingInterestToPay === "number" && inst.remainingInterestToPay > 0) {
        return inst.remainingInterestToPay;
      }
      const interest = inst.interest ?? 0;
      const paid = (inst.interestPaid ?? 0) + (inst.pendeningInterest ?? 0);
      return Math.max(0, interest - paid);
    };

    // 1. Intereses acumulados de todas las cuotas vencidas
    const overdueInterest = overdue.reduce(
      (sum, inst) => sum + getInstallmentPendingInterest(inst),
      0
    );

    // 2. Interés de la próxima cuota por pagar (si quedan cuotas posteriores a las de mora y hoy)
    const nextInstallmentInterest =
      hasRemainingInstallments && nextInstallment
        ? (nextInstallment.interest ?? 0)
        : 0;

    const nextInstallmentNumber = hasRemainingInstallments
      ? (nextInstallment?.installmentNumber ?? targetNextInstallmentNumber)
      : null;

    const hasNextInstallment = hasRemainingInstallments && (Boolean(nextInstallment) || targetNextInstallmentNumber !== null);

    // 3. Aplazamientos restantes por pagar de todo el crédito (afectan cuotas presentes y futuras)
    const remainingDeferment = Math.max(
      debt.remainingDefermentToPay ?? 0,
      financialSummary.totalDefermentArrears ?? 0
    );

    // 4. Mora por retraso acumulada hasta la fecha (dinámica + estática)
    const delayArrears = Math.max(
      debt.remainingArrearsToPay ?? 0,
      financialSummary.totalDelayArrears ?? 0
    );

    const isFixed = (debt.type ?? "fijo") === "fijo";

    // Para crédito de tipo fijo: Capital restante + intereses cuotas vencidas + interés de 1 cuota próxima + aplazamientos restantes
    const basePayoff = isFixed
      ? remainingCapital + overdueInterest + nextInstallmentInterest + remainingDeferment
      : (debt.remainingAmountToPay ?? remainingCapital) + overdueInterest + nextInstallmentInterest + remainingDeferment;

    const totalPayoff = basePayoff + delayArrears;

    return {
      isFixed,
      remainingCapital,
      overdueInterest,
      nextInstallmentInterest,
      nextInstallmentNumber: hasNextInstallment ? nextInstallmentNumber : null,
      remainingDeferment,
      delayArrears,
      basePayoff,
      totalPayoff,
    };
  }, [
    debt,
    overdue,
    hasRemainingInstallments,
    nextInstallment,
    targetNextInstallmentNumber,
    financialSummary.totalDefermentArrears,
    financialSummary.totalDelayArrears,
  ]);

  const handleSelectCredit = () => {
    if (oldestInstallment) {
      onClick(oldestInstallment);
    }
  };

  const oldestDate = oldestInstallment
    ? formatISOToInputDate(oldestInstallment.paymentDate || oldestInstallment.dueDate)
    : "";

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        borderColor: overdueCount > 0 ? "error.main" : "divider",
        backgroundColor: "background.paper",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: 4,
          borderColor: "primary.main",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardActionArea
        onClick={handleSelectCredit}
        sx={{
          p: 2,
          display: "block",
          textAlign: "left",
        }}
      >
        {/* ENCABEZADO DEL CRÉDITO */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} gap={1}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                bgcolor: (theme) =>
                  alpha(
                    overdueCount > 0 ? theme.palette.error.main : theme.palette.primary.main,
                    0.12
                  ),
                color: overdueCount > 0 ? "error.main" : "primary.main",
                borderRadius: 2,
                p: 0.9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCardIcon fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight="bold" variant="subtitle1" lineHeight={1.2}>
                Crédito: {debtName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalCount} cuota{totalCount !== 1 ? "s" : ""}{" "}
                {isCollectedView ? "pagadas" : "pendientes"}
                {debt?.debtTerms ? ` • Modalidad ${debt.debtTerms}` : ""}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {isCollectedView ? (
              <Chip label="Pagado" color="success" size="small" variant="filled" />
            ) : (
              <>
                {overdueCount > 0 && (
                  <Chip
                    label={`${overdueCount} en mora`}
                    color="error"
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: "bold" }}
                  />
                )}
                {pendingCount > 0 && (
                  <Chip
                    label={`${pendingCount} al día`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 1.2 }} />

        {/* DESGLOSE FINANCIERO */}
        {isCollectedView ? (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Total pagado:
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              ${financialSummary.totalPaidAmount.toLocaleString("es-CO")}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0.75}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Suma cuotas (Capital + Interés):
              </Typography>
              <Typography variant="body2" fontWeight="600">
                ${financialSummary.totalBaseAmount.toLocaleString("es-CO")}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography
                variant="body2"
                color={financialSummary.totalDelayArrears > 0 ? "error.main" : "text.secondary"}
              >
                Mora por retraso:
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                color={financialSummary.totalDelayArrears > 0 ? "error.main" : "text.primary"}
              >
                ${financialSummary.totalDelayArrears.toLocaleString("es-CO")}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography
                variant="body2"
                color={financialSummary.totalDefermentArrears > 0 ? "warning.main" : "text.secondary"}
              >
                Mora por aplazamiento:
              </Typography>
              <Typography
                variant="body2"
                fontWeight="600"
                color={financialSummary.totalDefermentArrears > 0 ? "warning.dark" : "text.primary"}
              >
                ${financialSummary.totalDefermentArrears.toLocaleString("es-CO")}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5, borderStyle: "dashed" }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight="bold">
                Total exigible a hoy:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                ${financialSummary.totalCreditAmount.toLocaleString("es-CO")}
              </Typography>
            </Box>
          </Stack>
        )}

        {/* SIMULACIÓN DE SALDO TOTAL RESTANTE (LIQUIDACIÓN REAL DEL CRÉDITO) */}
        {!isCollectedView && liquidationSimulation && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.info.main, 0.25),
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box display="flex" alignItems="center" gap={0.8}>
                <AccountBalanceWalletIcon fontSize="small" color="info" />
                <Typography variant="subtitle2" fontWeight="bold" color="info.dark">
                  Saldo real para liquidar crédito
                </Typography>
              </Box>
              <Chip
                label={liquidationSimulation.isFixed ? "Tipo Fijo" : "Tipo Variable"}
                size="small"
                variant="outlined"
                color="info"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            </Box>

            <Stack spacing={0.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  • Capital restante ({debt?.type ?? "fijo"}):
                </Typography>
                <Typography variant="caption" fontWeight="600">
                  ${liquidationSimulation.remainingCapital.toLocaleString("es-CO")}
                </Typography>
              </Box>

              {liquidationSimulation.overdueInterest > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="error.main" fontWeight="500">
                    • Intereses cuotas vencidas ({overdueCount} cuota{overdueCount !== 1 ? "s" : ""}):
                  </Typography>
                  <Typography variant="caption" fontWeight="600" color="error.main">
                    + ${liquidationSimulation.overdueInterest.toLocaleString("es-CO")}
                  </Typography>
                </Box>
              )}

              {liquidationSimulation.nextInstallmentInterest > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    • Interés próxima cuota {liquidationSimulation.nextInstallmentNumber ? `#${liquidationSimulation.nextInstallmentNumber}` : ""}:
                  </Typography>
                  <Typography variant="caption" fontWeight="600">
                    + ${liquidationSimulation.nextInstallmentInterest.toLocaleString("es-CO")}
                  </Typography>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  • Mora por aplazamiento (total restante):
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight="600"
                  color={liquidationSimulation.remainingDeferment > 0 ? "warning.dark" : "text.secondary"}
                >
                  + ${liquidationSimulation.remainingDeferment.toLocaleString("es-CO")}
                </Typography>
              </Box>

              {liquidationSimulation.delayArrears > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="error.main">
                    • Mora por retraso acumulada:
                  </Typography>
                  <Typography variant="caption" fontWeight="600" color="error.main">
                    + ${liquidationSimulation.delayArrears.toLocaleString("es-CO")}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 0.5, borderStyle: "dotted" }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="bold" color="info.dark">
                  Total para cancelar crédito:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="info.dark">
                  ${liquidationSimulation.totalPayoff.toLocaleString("es-CO")}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* INDICADOR DE CUOTA MÁS VIEJA PARA REGISTRAR PAGO */}
        {oldestInstallment && !isCollectedView && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: (theme) =>
                alpha(
                  overdueCount > 0 ? theme.palette.error.main : theme.palette.primary.main,
                  0.08
                ),
              border: "1px dashed",
              borderColor: (theme) =>
                alpha(
                  overdueCount > 0 ? theme.palette.error.main : theme.palette.primary.main,
                  0.3
                ),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="caption"
                display="block"
                color={overdueCount > 0 ? "error.dark" : "text.secondary"}
                fontWeight={500}
              >
                Cobro inicia en la cuota más antigua:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Cuota #{oldestInstallment.installmentNumber} • Vence: {oldestDate || "N/A"}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5} color="primary.main">
              <Typography variant="caption" fontWeight="bold">
                Cobrar
              </Typography>
              <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
            </Box>
          </Box>
        )}
      </CardActionArea>
    </Card>
  );
};

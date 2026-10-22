import { useEffect, useMemo, useState } from "react";
import { Box, Card, CircularProgress, Stack, Typography, Chip } from "@mui/material";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { InstallmentItem } from "../../atoms/InstallmentItem";
import { DebtRenewalModule } from "../../organisms/DebtRenewalModule";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import { calculateDebtArrearsSummary } from "../../../features/debits/domain/business/services/calculateInstallmentArrears";
import { MoneyTypography } from "../../atoms/MoneyTypography";
import FormatNumberToMoney from "../../sub_atomic_particles/FormatNumberToMoney";

export const AuditorInstallmentsScreen = () => {
  const { idDebt } = useParams<{ idDebt: string }>();
  const user = useAppSelector((state) => state.user.user);
  const companyId = user?.companyId ?? "";

  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [debt, setDebt] = useState<Debt | null>(null);

  const fetchDetails = async () => {
    if (!idDebt || !companyId) {
      window.alert("No se encontró la deuda");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const installmentOrchestrator = new InstallmentsOrchestrator();
      const debtOrchestrator = new DebtOrchestrator();

      const [instResult, debtResult] = await Promise.all([
        installmentOrchestrator.getByDebt({
          debtId: idDebt,
          companyId,
        }),
        debtOrchestrator.getDebitById({
          idDebt,
          companyId,
        }),
      ]);

      if (instResult.state.ok) {
        setInstallments(instResult.state.value);
      }
      if (debtResult.state.ok) {
        setDebt(debtResult.state.value);
      }
    } catch (error) {
      console.error("Error cargando detalles de la deuda", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [idDebt, companyId]);

  const debtArrearsSummary = useMemo(() => {
    return calculateDebtArrearsSummary(installments, debt);
  }, [installments, debt]);

  const totalPaid = useMemo(() => {
    return (
      debt?.totalPaid ??
      installments.reduce(
        (acc, curr) => acc + (curr.totalPaid ?? curr.amountPaid ?? 0),
        0
      )
    );
  }, [debt?.totalPaid, installments]);

  const totalBaseRemaining = useMemo(() => {
    return installments.reduce((acc, curr) => {
      if (
        curr.status === "pagada" ||
        (curr.outstandingReceivables !== undefined && curr.outstandingReceivables <= 0)
      ) {
        return acc;
      }
      return acc + Math.max(0, (curr.amount ?? 0) - (curr.amountPaid ?? 0));
    }, 0);
  }, [installments]);

  const capitalAndInterestSummary = useMemo(() => {
    const totalContractCapital =
      debt?.capital ??
      installments.reduce((acc, curr) => acc + (curr.capital ?? 0), 0);
    const totalContractInterest =
      debt?.interest ??
      installments.reduce((acc, curr) => acc + (curr.interest ?? 0), 0);

    const totalCapitalPaid = installments.reduce(
      (acc, curr) => acc + (curr.capitalPaid ?? 0),
      0
    );
    const totalInterestPaid = installments.reduce(
      (acc, curr) => acc + (curr.interestPaid ?? 0),
      0
    );

    const totalCapitalPending = installments.reduce((acc, curr) => {
      const isPaid =
        curr.status === "pagada" ||
        (curr.outstandingReceivables !== undefined &&
          curr.outstandingReceivables <= 0);
      if (isPaid) return acc;
      const pending =
        curr.remainingCapitalToPay > 0
          ? curr.remainingCapitalToPay
          : Math.max(0, (curr.capital ?? 0) - (curr.capitalPaid ?? 0));
      return acc + pending;
    }, 0);

    const totalInterestPending = installments.reduce((acc, curr) => {
      const isPaid =
        curr.status === "pagada" ||
        (curr.outstandingReceivables !== undefined &&
          curr.outstandingReceivables <= 0);
      if (isPaid) return acc;
      const pending =
        curr.remainingInterestToPay > 0
          ? curr.remainingInterestToPay
          : Math.max(0, (curr.interest ?? 0) - (curr.interestPaid ?? 0));
      return acc + pending;
    }, 0);

    return {
      totalContractCapital,
      totalContractInterest,
      totalCapitalPaid,
      totalInterestPaid,
      totalCapitalPending,
      totalInterestPending,
    };
  }, [debt?.capital, debt?.interest, installments]);

  const remainingBalance = totalBaseRemaining + debtArrearsSummary.totalArrears;

  if (loading) {
    return <CircularProgress />;
  }

  const sortedInstallments = [...installments].sort(
    (a, b) => a.installmentNumber - b.installmentNumber,
  );

  const isRenewable =
    installments.length > 0 &&
    installments.filter((i) => i.status === "negociada" || i.status === "pagada")
      .length >=
    installments.length / 2;

  return (
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">Cuotas de la deuda</Typography>
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
        {debt && (
          <DebtRenewalModule
            companyId={companyId}
            currentDebt={debt}
            installments={installments}
            totalPaid={totalPaid}
            remainingBalance={remainingBalance}
            context="auditor"
            onSuccess={fetchDetails}
          />
        )}
      </Stack>

      <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: "grey.50" }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
          Resumen Consolidado de Saldos
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 5 }}
          sx={{ mb: 2, pb: 2, borderBottom: "1px dashed", borderColor: "divider" }}
        >
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              🏦 Consolidado de Capital
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Pactado: <strong>${FormatNumberToMoney(capitalAndInterestSummary.totalContractCapital)}</strong>
            </Typography>
            <Typography variant="body2" color="success.main">
              Pagado Real: <strong>${FormatNumberToMoney(capitalAndInterestSummary.totalCapitalPaid)}</strong>
            </Typography>
            <Typography
              variant="body2"
              color={capitalAndInterestSummary.totalCapitalPending > 0 ? "error.main" : "text.secondary"}
            >
              Pendiente: <strong>${FormatNumberToMoney(capitalAndInterestSummary.totalCapitalPending)}</strong>
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              📈 Consolidado de Interés
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Pactado: <strong>${FormatNumberToMoney(capitalAndInterestSummary.totalContractInterest)}</strong>
            </Typography>
            <Typography variant="body2" color="success.main">
              Pagado Real: <strong>${FormatNumberToMoney(capitalAndInterestSummary.totalInterestPaid)}</strong>
            </Typography>
            <Typography
              variant="body2"
              color={capitalAndInterestSummary.totalInterestPending > 0 ? "error.main" : "text.secondary"}
            >
              Pendiente: <strong>${FormatNumberToMoney(capitalAndInterestSummary.totalInterestPending)}</strong>
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} flexWrap="wrap">
          <MoneyTypography label="Saldo Base Restante:" value={totalBaseRemaining} />
          <MoneyTypography
            label="Mora por Retraso:"
            value={debtArrearsSummary.totalDelayArrears}
            sx={{ color: debtArrearsSummary.totalDelayArrears > 0 ? "error.main" : "text.primary" }}
          />
          <MoneyTypography
            label="Mora por Aplazamiento:"
            value={debtArrearsSummary.totalDefermentArrears}
            sx={{ color: debtArrearsSummary.totalDefermentArrears > 0 ? "warning.main" : "text.primary" }}
          />
          <MoneyTypography
            label="Total Restante por Cobrar:"
            value={remainingBalance}
            sx={{ fontWeight: "bold" }}
          />
        </Stack>
      </Card>

      <Stack spacing={2}>
        {sortedInstallments.map((installment) => (
          <InstallmentItem
            key={installment.id}
            installment={installment}
            debt={debt}
          />
        ))}

        {sortedInstallments.length === 0 && (
          <Typography color="text.secondary">
            Esta deuda no tiene cuotas registradas.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};


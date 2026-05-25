import { useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography, Chip } from "@mui/material";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { InstallmentItem } from "../../atoms/InstallmentItem";
import { DebtRenewalModule } from "../../organisms/DebtRenewalModule";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";

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

  if (loading) {
    return <CircularProgress />;
  }

  const sortedInstallments = [...installments].sort(
    (a, b) => a.installmentNumber - b.installmentNumber,
  );

  console.log("installments", installments);


  const isRenewable =
    installments.length > 0 &&
    installments.filter((i) => i.status === "liquidada" || i.status === "pagada")
      .length >=
    installments.length / 2;

  const totalPaid = installments.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalDebtAmount = debt?.totalAmount || 0;
  const remainingBalance = Math.max(0, totalDebtAmount - totalPaid);

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
            totalPaid={totalPaid}
            remainingBalance={remainingBalance}
            context="auditor"
            onSuccess={fetchDetails}
          />
        )}
      </Stack>

      <Stack spacing={2}>
        {sortedInstallments.map((installment) => (
          <InstallmentItem key={installment.id} installment={installment} />
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


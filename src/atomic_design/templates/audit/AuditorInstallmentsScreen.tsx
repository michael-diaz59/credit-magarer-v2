import { useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { InstallmentItem } from "../../atoms/InstallmentItem";


export const AuditorInstallmentsScreen = () => {
  const { idDebt } = useParams<{ idDebt: string }>();
  const user = useAppSelector((state) => state.user.user);
  const companyId = user?.companyId ?? "";

  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    if (!idDebt || !companyId) {
      window.alert("No se encontró la deuda");
      setLoading(false);
      return;
    }

    const fetchInstallments = async () => {
      try {
        setLoading(true);
        const orchestrator = new InstallmentsOrchestrator();

        const result = await orchestrator.getByDebt({
          debtId: idDebt,
          companyId,
        });

        if (result.state.ok) {
          setInstallments(result.state.value);
        }
      } catch (error) {
        console.error("Error cargando cuotas de la deuda", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstallments();
  }, [idDebt, companyId]);

  if (loading) {
    return <CircularProgress />;
  }
  const sortedInstallments = [...installments].sort(
    (a, b) => a.installmentNumber - b.installmentNumber,
  );

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Cuotas de la deuda
      </Typography>

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

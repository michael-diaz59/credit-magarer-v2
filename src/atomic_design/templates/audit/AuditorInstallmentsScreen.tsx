import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";

const statusColorMap: Record<
  Installment["status"],
  "default" | "success" | "warning" | "error"
> = {
  pendiente: "warning",
  incompleto: "warning",
  pagada: "success",
  cancelada: "default",
  liquidada: "success",
};

export const AuditorInstallmentsScreen = () => {
  const { idDebt } = useParams<{ idDebt: string }>();
  const navigate = useNavigate();
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

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Cuotas de la deuda
      </Typography>

      <Stack spacing={2}>
        {installments.map((installment, index) => (
          <Box
            key={installment.id}
            p={2}
            border="1px solid"
            borderColor="divider"
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
            >
              <Typography fontWeight={500}>
                Cuota #{index + 1} — ${installment.amount}
              </Typography>

              <Chip
                label={installment.status}
                color={statusColorMap[installment.status]}
                size="small"
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Vence: {installment.dueDate}
            </Typography>

            {installment.paidAt && (
              <Typography variant="body2" color="text.secondary">
                Pagada el: {installment.paidAt}
              </Typography>
            )}
          </Box>
        ))}

        {installments.length === 0 && (
          <Typography color="text.secondary">
            Esta deuda no tiene cuotas registradas.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

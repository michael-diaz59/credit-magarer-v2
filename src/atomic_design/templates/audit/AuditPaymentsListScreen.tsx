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

  useEffect(() => {
    console.log(companyId,idInstallment)
    if (!companyId) {
      setLoading(false);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const orchestrator = new PaymentOrchestrator();
        const result = await orchestrator.getByInstallment({ companyId:companyId,installmentId:idInstallment??""});

        if (result.state.ok) {
          setPayments(result.state.value);
        }
      } catch (error) {
        console.error("Error cargando pagos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [companyId]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Pagos registrados
      </Typography>

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
            onClick={() => navigate(ScreenPaths.auditor.payment(payment.id??"" ))}
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

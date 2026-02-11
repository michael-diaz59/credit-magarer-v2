import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Payment } from "../../../features/debits/domain/business/entities/Payment";
import PaymentOrchestrator from "../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import { MiniMap } from "../../organisms/MiniMap";

const statusColorMap = {
  registrado: "warning",
  conflicto: "error",
  confirmado: "success",
  cancelada: "default",
} as const;

export const PaymentDetailScreen = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  const companyId = useAppSelector((state) => state.user.user?.companyId) ?? "";

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    console.log(paymentId,companyId)
    if (!paymentId || !companyId) return;

    const fetchPayment = async () => {
      try {
        setLoading(true);
        const orchestrator = new PaymentOrchestrator();

        const result = await orchestrator.getById({
          paymentId,
          companyId,
        });

        if (result.ok) {
          if (result.value) {
            setPayment(result.value.payment);
          }
        }
      } catch (error) {
        console.error("Error cargando pago", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, companyId]);

  if (loading) return <CircularProgress />;

  if (!payment) {
    return <Typography>No se encontró el pago</Typography>;
  }

  return (
    <Box p={3}>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Pago — ${payment.amount}</Typography>

        <Chip label={payment.status} color={statusColorMap[payment.status]} />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* INFO GENERAL */}
      <Stack spacing={1}>
        <Typography>
          Cliente: <strong>{payment.costumerName}</strong>
        </Typography>

        <Typography>
          Cobrador: <strong>{payment.collectorName}</strong>
        </Typography>

        <Typography>Método de pago: {payment.method}</Typography>

        <Typography>Fecha de pago: {payment.paidAt}</Typography>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* OBSERVACIONES */}
      <Stack spacing={1}>
        <Typography variant="subtitle1">Observaciones</Typography>

        <Typography color="text.secondary">
          Cobrador: {payment.collectorObservation || "—"}
        </Typography>

        <Typography color="text.secondary">
          Contador: {payment.accountantObservation || "—"}
        </Typography>
      </Stack>

      {/* MAPA */}
      {payment.location && (
        <>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" mb={1}>
            Ubicación del pago
          </Typography>

          <MiniMap
            latitude={payment.location.latitude}
            longitude={payment.location.longitude}
          />
        </>
      )}

      {/* ACCIONES */}
      <Divider sx={{ my: 3 }} />

      <Button
        variant="outlined"
        onClick={() => navigate(`/audit/payments/${payment.id}/proof`)}
      >
        Ver comprobante de pago
      </Button>
    </Box>
  );
};

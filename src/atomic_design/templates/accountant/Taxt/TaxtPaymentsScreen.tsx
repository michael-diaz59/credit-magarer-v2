import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Card, CardContent, CircularProgress, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import TaxtOrchestrator from "../../../../features/taxt/domain/infraestructure/TaxtOrchestrator";
import { type TaxtPayment } from "../../../../features/taxt/domain/business/entities/TaxtPayment";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";

export const TaxtPaymentsScreen: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [payments, setPayments] = useState<TaxtPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    if (!companyId) return;
    setLoading(true);
    const orchestrator = new TaxtOrchestrator();
    const result = await orchestrator.getTaxtPaymentsByCompany({ companyId });
    if (result.ok) {
      setPayments(result.value.payments);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [companyId]);

  return (
    <Box p={4} sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Pagos de Impuestos
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={loadPayments}
            startIcon={<RefreshIcon />}
            disabled={loading}
          >
            Cargar pagos
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(ScreenPaths.accountant.taxtPaymentRegistration)}
            startIcon={<AddIcon />}
          >
            Registrar pago
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      ) : payments.length === 0 ? (
        <Typography variant="h6" textAlign="center" color="textSecondary" mt={10}>
          No hay pagos registrados.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {[...payments].map((payment) => (
            <Card
              key={payment.id}
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.01)", boxShadow: 4 },
              }}
              onClick={() => navigate(ScreenPaths.accountant.taxtPaymentDetails(payment.id))}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" color="primary">
                      {FormatNumberToMoney(payment.amount)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Fecha: {payment.createdAt} | Método: {payment.method}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor:
                          payment.status === "confirmado"
                            ? theme.palette.success.light
                            : payment.status === "conflicto"
                            ? theme.palette.error.light
                            : theme.palette.warning.light,
                        color: "#fff",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      {payment.status}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

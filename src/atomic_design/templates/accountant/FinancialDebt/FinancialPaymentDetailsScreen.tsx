
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Card, CardContent, CircularProgress, Divider, useTheme, Grid, IconButton } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FinancialPaymentOrchestrator from "../../../../features/financialDebt/domain/infraestructure/FinancialPaymentOrchestrator";
import { type FinancialPayment } from "../../../../features/financialDebt/domain/business/entities/FinancialPayment";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";

export const FinancialPaymentDetailsScreen: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const theme = useTheme();
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [payment, setPayment] = useState<FinancialPayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId || !companyId) return;

    const fetchPayment = async () => {
      setLoading(true);
      const orchestrator = new FinancialPaymentOrchestrator();
      const result = await orchestrator.getPaymentById({ companyId, paymentId });

      if (result.ok) {
        setPayment(result.value);
      }
      setLoading(false);
    };

    fetchPayment();
  }, [paymentId, companyId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6">Pago no encontrado.</Typography>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={800} mx="auto">
      <Stack direction="row" alignItems="center" spacing={1} mb={4}>
        <IconButton onClick={() => navigate(-1)} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Detalle del Pago
        </Typography>
      </Stack>

      <Card elevation={4} sx={{ borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ bgcolor: theme.palette.primary.main, color: "white", p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>Monto Pagado</Typography>
          <Typography variant="h2" fontWeight="bold">
            $ {FormatNumberToMoney(payment.amount)}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid>
              <Box mb={3}>
                <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Fecha de Pago</Typography>
                <Typography variant="h6">{new Date(payment.createAt).toLocaleString()}</Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Método</Typography>
                <Typography variant="h6">{payment.method}</Typography>
              </Box>
            </Grid>

            <Grid>
              <Box mb={3}>
                <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Registrado por</Typography>
                <Typography variant="h6">{payment.collectorName}</Typography>
              </Box>

              {payment.bankAccountId && (
                <Box mb={3}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Cuenta Bancaria</Typography>
                  <Typography variant="body1">{payment.bankAccountId}</Typography>
                </Box>
              )}
            </Grid>

            {payment.location && (
              <Grid>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Ubicación</Typography>
                <Typography variant="body2">
                  Lat: {payment.location.latitude}, Lng: {payment.location.longitude}
                </Typography>
                <Button
                  size="small"
                  color="primary"
                  href={`https://www.google.com/maps/search/?api=1&query=${payment.location.latitude},${payment.location.longitude}`}
                  target="_blank"
                  sx={{ mt: 1 }}
                >
                  Ver en Google Maps
                </Button>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight="bold" mb={3}>Comprobante de Pago</Typography>

          {payment.idProofOfPayment ? (
            <Box>
              {payment.idProofOfPayment.toLowerCase().includes(".pdf") || payment.idProofOfPayment.toLowerCase().includes("pdf") ? (
                <Button
                  variant="contained"
                  fullWidth
                  href={payment.idProofOfPayment}
                  target="_blank"
                  startIcon={<FileDownloadIcon />}
                  sx={{ py: 2, borderRadius: 3 }}
                >
                  Abrir Comprobante (PDF)
                </Button>
              ) : (
                <Box
                  component="img"
                  src={payment.idProofOfPayment}
                  alt="Comprobante de pago"
                  sx={{
                    width: "100%",
                    borderRadius: 3,
                    boxShadow: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    maxHeight: 600,
                    objectFit: "contain"
                  }}
                />
              )}
              <Button
                variant="outlined"
                fullWidth
                href={payment.idProofOfPayment}
                target="_blank"
                sx={{ mt: 2, borderRadius: 3 }}
              >
                Ver en pantalla completa
              </Button>
            </Box>
          ) : (
            <Box py={4} bgcolor="action.hover" borderRadius={3} textAlign="center">
              <Typography color="textSecondary">No se adjuntó comprobante para este pago.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="textSecondary">
          ID de Referencia: {payment.id}
        </Typography>
      </Box>
    </Box>
  );
};

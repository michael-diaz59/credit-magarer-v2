import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Card, CardContent, CircularProgress, Divider, Chip, useTheme, Grid } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../../../store/firebase/firebase";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import AnotherPaymentOrchestrator from "../../../../features/anotherPayment/domain/infraestructure/AnotherPaymentOrchestrator";
import { type AnotherPayment } from "../../../../features/anotherPayment/domain/business/entities/AnotherPayment";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";

export const AnotherPaymentDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [payment, setPayment] = useState<AnotherPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !companyId) return;

    const fetchPayment = async () => {
      setLoading(true);
      const orchestrator = new AnotherPaymentOrchestrator();
      const result = await orchestrator.getAnotherPaymentById({ companyId, id });

      if (result.ok && result.value.payment) {
        setPayment(result.value.payment);

        if (result.value.payment.idProofOfPayment) {
          try {
            const path = `companies/${companyId}/anotherPayments/${id}/${result.value.payment.idProofOfPayment}`;
            const fileRef = ref(storage, path);
            const url = await getDownloadURL(fileRef);
            setProofUrl(url);
          } catch (error) {
            console.error("Error fetching proof URL", error);
          }
        }
      }
      setLoading(false);
    };

    fetchPayment();
  }, [id, companyId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
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
    <Box p={4} maxWidth={800} mx="auto">
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
        Volver
      </Button>

      <Card elevation={6} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                Detalle de Pago
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Categoría: <strong>{payment.category}</strong>
              </Typography>
            </Box>
            <Chip
              label={payment.status}
              sx={{
                backgroundColor:
                  payment.status === "confirmado"
                    ? theme.palette.success.main
                    : payment.status === "conflicto"
                      ? theme.palette.error.main
                      : theme.palette.warning.main,
                color: "#fff",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid >
              <Typography variant="caption" color="textSecondary">Monto</Typography>
              <Typography variant="h5" color="primary" sx={{ mb: 3 }}>
                {FormatNumberToMoney(payment.amount)}
              </Typography>

              <Typography variant="caption" color="textSecondary">Fecha</Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>{payment.createdAt}</Typography>

              <Typography variant="caption" color="textSecondary">Método de Pago</Typography>
              <Typography variant="body1">{payment.method}</Typography>
            </Grid>

            <Grid >
              <Typography variant="caption" color="textSecondary">Cuenta Bancaria ID</Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>{payment.bankAccountId || "N/A"}</Typography>

              <Typography variant="caption" color="textSecondary">Observaciones</Typography>
              <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                {payment.observations || "Sin observaciones."}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" mb={2}>Comprobante de Pago</Typography>
          {proofUrl ? (
            <Box>
              {payment.idProofOfPayment.toLowerCase().endsWith(".pdf") ? (
                <Button
                  variant="contained"
                  href={proofUrl}
                  target="_blank"
                  startIcon={<FileDownloadIcon />}
                >
                  Descargar PDF
                </Button>
              ) : (
                <Box
                  component="img"
                  src={proofUrl}
                  alt="Comprobante"
                  sx={{
                    width: "100%",
                    maxHeight: 500,
                    objectFit: "contain",
                    borderRadius: 2,
                    border: "1px solid #eee",
                  }}
                />
              )}
            </Box>
          ) : (
            <Typography color="textSecondary">No hay comprobante disponible.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

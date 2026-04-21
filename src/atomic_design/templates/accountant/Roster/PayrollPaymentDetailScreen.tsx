
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Stack, Card, CardContent, CircularProgress, Divider, Chip, useTheme, Grid, IconButton } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../../../store/firebase/firebase";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import PayrollOrchestrator from "../../../../features/roster/domain/infraestructure/PayrollOrchestrator";
import { type Payroll } from "../../../../features/roster/domain/business/entities/Payroll";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";

export const PayrollPaymentDetailScreen: React.FC = () => {
  const { payrollId } = useParams<{ payrollId: string }>();
  const theme = useTheme();
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [payment, setPayment] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!payrollId || !companyId) return;

    const fetchPayment = async () => {
      setLoading(true);
      const orchestrator = new PayrollOrchestrator();
      const result = await orchestrator.getPaymentById({ companyId, payrollId });

      if (result.ok) {
        setPayment(result.value);

        if (result.value.idProof) {
          try {
            // Path structure from FirebasePayrollRepository.uploadProof
            // companies/${companyId}/payroll/${payrollId}/${fileName}
            const path = `companies/${companyId}/payroll/${payrollId}/${result.value.idProof}`;
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
  }, [payrollId, companyId]);

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
          Detalle del Pago de Nómina
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Estado</Typography>
              <Box mt={0.5}>
                <Chip
                  label={payment.status}
                  color={payment.status === "confirmado" ? "success" : "primary"}
                  sx={{ fontWeight: "bold", textTransform: "uppercase" }}
                />
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Fecha</Typography>
              <Typography variant="h6">{payment.createdAt}</Typography>
            </Box>
          </Stack>

          <Grid container spacing={4}>
            <Grid >
              <Box mb={3}>
                <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Método de Pago</Typography>
                <Typography variant="h6" sx={{ textTransform: "capitalize" }}>{payment.method}</Typography>
              </Box>
            </Grid>

            <Grid >
              {payment.bankAccountId && (
                <Box mb={3}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>Cuenta Bancaria ID</Typography>
                  <Typography variant="body1">{payment.bankAccountId}</Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight="bold" mb={3}>Comprobante de Pago</Typography>

          {proofUrl ? (
            <Box>
              {payment.idProof.toLowerCase().endsWith(".pdf") ? (
                <Button
                  variant="contained"
                  fullWidth
                  href={proofUrl}
                  target="_blank"
                  startIcon={<FileDownloadIcon />}
                  sx={{ py: 2, borderRadius: 3 }}
                >
                  Abrir Comprobante (PDF)
                </Button>
              ) : (
                <Box
                  component="img"
                  src={proofUrl}
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
                href={proofUrl}
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

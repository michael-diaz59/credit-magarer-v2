import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  cloneInstallment,
  type Installment,
} from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { BaseDialog } from "../../atoms/BaseDialog";

export const InstallmentDetailScreen = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBody, setDialogBody] = useState("");
  const [dialogTitle, setDialogTitle] = useState<string | undefined>(undefined);
  const { id: installmentId } = useParams<{ id: string }>();
  const collectorId: string = useAppSelector(
    (state) => state.user.user?.id ?? "",
  );

  const companyId: string = useAppSelector(
    (state) => state.user.user?.companyId ?? "",
  );
  const [loading, setLoading] = useState(false);
  const emptyInstallment: Installment = {
    id: "",
    debtId: "",

    installmentTotalNumber:0,
    originalInterestRate:0,
    paidAmount:0,
    paidAt:"",

    interestRate: 0,
    collectorId: "",
    costumerId: "",
    costumerDocument: "",
    costumerName: "",
    costumerAddres: {
      address: "",
      neighborhood: "",
      stratum: 1,
      city: "",
    },
    installmentNumber: 1,
    amount: 0,
    dueDate: new Date().toISOString().split("T")[0], // Fecha de hoy por defecto
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };
  const [installment, setInstallment] = useState<Installment>(emptyInstallment);

  useEffect(() => {
    if (!installmentId) {
      return;
    }
    const fetchInstallment = async () => {
      try {
        setLoading(true);
        const installmentsOrchestrator = new InstallmentsOrchestrator();

        const result = await installmentsOrchestrator.getById({
          companyId: companyId,
          collectorId: collectorId,
          installmentId: installmentId,
        });

        if (result.ok) {
          console.log(result.value.state);
          setInstallment(result.value.state);
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        console.error("Error cargando cuotas:", error);
      }
    };
    fetchInstallment();
  }, [installmentId, companyId, collectorId]);

  const markInstallmentAsPaid = async () => {
    console.log(installment);
    if (!installmentId) return;

    try {
      setLoading(true);

      const installmentsOrchestrator = new InstallmentsOrchestrator();
      const cache = cloneInstallment(installment);

      cache.status = "pagada";
      cache.paidAt = new Date().toISOString().split("T")[0];

      const result = await installmentsOrchestrator.updateById({
        companyId,
        installment: cache,
      });

      if (result.ok) {
        setInstallment(cache);
        setDialogTitle("Cuota actualizada");
        setDialogBody("La cuota fue marcada como pagada correctamente.");
      } else {
        setDialogTitle("Error");
        setDialogBody("No se pudo actualizar la cuota.");
      }
    } catch (error) {
      console.error(error);
      setDialogTitle("Error");
      setDialogBody("Ocurrió un error al actualizar la cuota.");
    } finally {
      setLoading(false);
      setDialogOpen(true);
    }
  };

  if (!installment) {
    return <Typography>No se encontró la cuota</Typography>;
  }
  const canBePaid =
    installment.status === "pendiente" || installment.status === "incompleto";

  if (loading && !installment.id) {
    return (
      <Box
        height="70vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2}>
      <BaseDialog
        open={dialogOpen}
        title={dialogTitle}
        body={dialogBody}
        butonText="Aceptar"
        onClick={() => setDialogOpen(false)}
      />
      <Typography variant="h5" mb={2}>
        Detalle de la cuota
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* ESTADO */}
            <Chip
              label={installment.status.replace("_", " ")}
              color={
                installment.status === "pendiente"
                  ? "error"
                  : installment.status === "incompleto"
                    ? "warning"
                    : "success"
              }
            />

            {/* CLIENTE */}
            <Box>
              <Typography fontWeight="bold">
                {installment.costumerName}
              </Typography>
              <Typography variant="body2">
                📄 {installment.costumerDocument}
              </Typography>
            </Box>

            {/* DIRECCIÓN */}
            <Box>
              <Typography variant="subtitle2">Dirección</Typography>
              <Typography variant="body2">
                📍 {installment.costumerAddres.address}
              </Typography>
              <Typography variant="body2">
                {installment.costumerAddres.neighborhood} –{" "}
                {installment.costumerAddres.city}
              </Typography>
            </Box>

            <Divider />

            {/* INFO CUOTA */}
            <Box>
              <Typography variant="body2">
                Cuota {installment.installmentNumber}
              </Typography>
              <Typography variant="h6">
                ${installment.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Vence: {new Date(installment.dueDate).toLocaleDateString()}
              </Typography>
            </Box>

            {/* ACCIÓN */}
            {canBePaid && (
              <Button
                variant="contained"
                color="success"
                size="large"
                disabled={loading}
                onClick={markInstallmentAsPaid}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Procesando..." : "Marcar como pagada"}
              </Button>
            )}

            {!canBePaid && (
              <Typography color="text.secondary">
                Esta cuota ya no puede ser modificada
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

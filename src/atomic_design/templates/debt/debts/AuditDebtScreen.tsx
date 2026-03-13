import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { LoadingOverlay } from "../../../molecules/LoadingOverlay";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { DebtForm, type DebtFormAction } from "../DebtForm";
import { RenewalComparisonForm } from "../RenewalComparisonForm";

export const AuditDebtScreen = () => {
  const user = useAppSelector((state) => state.user.user);
  const companyId = user?.companyId || "undefined";
  const { debitId } = useParams<{ debitId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title?: string;
    body: string;
    buttonText?: string;
  }>({
    body: "",
  });

  const handleUpdateDebt = async (_: DebtFormAction, data: Omit<Debt, "id">) => {
    if (!data || !debitId) return;

    setLoading(true);
    setDialogOpen(false);

    try {
      const orchestrator = new DebtOrchestrator();
      const debtToUpdate: Debt = {
        ...data,
        id: debitId,
      };

      const update = await orchestrator.updateDebtUse({
        isNewCollector: true,
        companyId: companyId,
        debt: debtToUpdate,
      });

      if (update.state.ok) {
        setDialogConfig({
          title: "Actualización exitosa",
          body: "La deuda fue actualizada correctamente.",
          buttonText: "Entendido",
        });
      } else {
        setDialogConfig({
          title: "Error al actualizar",
          body: update.state.error.code ?? "Ocurrió un error inesperado al actualizar la deuda.",
          buttonText: "Cerrar",
        });
      }
    } catch {
      setDialogConfig({
        title: "Error",
        body: "No fue posible completar la operación. Intenta nuevamente.",
        buttonText: "Cerrar",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setDialogOpen(true);
      }, 200);
    }
  };

  const [form, setForm] = useState<Omit<Debt, "id"> | null>(null);
  const [originalDebt, setOriginalDebt] = useState<Omit<Debt, "id"> | null>(null);

  useEffect(() => {
    const loadDebt = async () => {
      if (!debitId) return;

      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.getDebitById({
        idDebt: debitId,
        companyId: companyId,
      });

      if (result.state.ok && result.state.value) {
        const currentDebt = result.state.value;
        setForm(currentDebt);

        if (currentDebt.status === "preAprobada" && currentDebt.originalDebt) {
          const originalResult = await orchestrator.getDebitById({
            idDebt: currentDebt.originalDebt,
            companyId: companyId,
          });

          if (originalResult.state.ok && originalResult.state.value) {
            setOriginalDebt(originalResult.state.value);
          }
        }
      }
    };

    loadDebt();
  }, [debitId, companyId]);

  if (!form) return null;

  return (
    <Box p={3} width="100%">
      <>
        <LoadingOverlay open={loading} />
        <BaseDialog
          open={dialogOpen}
          title={dialogConfig.title}
          body={dialogConfig.body}
          butonText={dialogConfig.buttonText}
          onClick={() => setDialogOpen(false)}
        />
      </>
      <Box position="relative">
        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              {originalDebt ? "Aprobar Renovación de Deuda" : "Detalle de la deuda"}
            </Typography>

            {originalDebt && debitId && form.status === "preAprobada" ? (
              <RenewalComparisonForm
                debtId={debitId}
                originalDebt={originalDebt}
                proposedDebt={form}
                mode="audit"
                onSubmit={handleUpdateDebt}
              />
            ) : (
              <DebtForm
                defaultValues={form}
                debtId={debitId}
                mode="audit"
                allowedActions={["update"]}
                onSubmit={handleUpdateDebt}
              />
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
              <Button onClick={() => navigate(-1)} disabled={loading}>
                Volver
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

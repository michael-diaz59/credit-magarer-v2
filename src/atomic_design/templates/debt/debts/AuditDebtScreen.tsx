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

export const AuditDebtScreen = () => {
  const companyId = useAppSelector(
    (state) => state.user.user?.companyId || "undefined",
  );
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
  console.log(debitId)

  const handleUpdateDebt = async (_: DebtFormAction, data: Omit<Debt, "id">) => {
    console.log(data)
    console.log(debitId)
    if (!data || !debitId) return;

    setLoading(true); // 1️⃣ mostrar loading
    setDialogOpen(false); // aseguramos que esté cerrado

    try {
      const orchestrator = new DebtOrchestrator();

      console.log(debitId)
      const debtToUpdate: Debt = {
        ...data, // 👈 resto de campos del formulario
        id: debitId, // 👈 el ID viene de la URL
      };
      console.log(debtToUpdate.id)

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
          body:
            update.state.error.code ??
            "Ocurrió un error inesperado al actualizar la deuda.",
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
      setLoading(false); // 2️⃣ ocultar loading
      setTimeout(() => {
        // 3️⃣ pequeño delay UX-friendly
        setDialogOpen(true); // 4️⃣ mostrar popup
      }, 200);
    }
  };

  const [form, setForm] = useState<Omit<Debt, "id"> | null>(null);

  useEffect(() => {
    const loadDebt = async () => {
        //valida si la pantalla debe cargar una deuda
      if (!debitId) return;

      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.getDebitById({
        idDebt: debitId,
        companyId: companyId,
      });

      if (result.state.ok) {
        setForm(result.state.value);
      } else {
        console.log(result.state.error);
      }
    };

    loadDebt();
  }, [debitId]);



  if (!form) return null;

  return (
    <Box p={3} maxWidth={600} mx="auto">
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
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Detalle de la deuda
            </Typography>

            <DebtForm
              defaultValues={form}
              debtId={debitId}
              mode={"audit"}
              allowedActions={["update"]}
              onSubmit={handleUpdateDebt }
            />

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

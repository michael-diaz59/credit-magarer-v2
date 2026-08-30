import { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import type { DebtFormMode } from "../DebtFormMode";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { LoadingOverlay } from "../../../molecules/LoadingOverlay";
import { BaseDialog } from "../../../atoms/BaseDialog";

import { DebtForm, mapDebtToForm, mergeDebtWithForm, type DebtFormRef } from "../debtForm";
import { DebtFormDataProvider } from "./DebtFormDataProvider";
import { preaprovarCredito } from "../../../sub_atomic_particles/debFormConsts";

/**pantalla deuda del asesor de oficina */
export const ViewDebtScreen = () => {
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

  const formRef = useRef<DebtFormRef>(null);

  const handleSubmit = async (action: "update" | "preApprove") => {
    const isValid = await formRef.current?.validate();
    if (!isValid) return;

    const formValues = formRef.current?.getValues();
    if (!formValues) return;

    if (!form) return;

    // merge updated form fields into existing debt object
    // Casting form to Debt since form does contain the other fields, we just need the id.
    const originalDebt = { ...form, id: debitId } as Debt;
    const updatedDebtInfo = mergeDebtWithForm(originalDebt, formValues);

    if (action === "update") {
      handleUpdateDebt(updatedDebtInfo);
    } else if (action === "preApprove") {
      handlePreAbroves(updatedDebtInfo);
    }
  };

  const handlePreAbroves = async (debtToUpdate: Debt) => {
    const orchestrator = new DebtOrchestrator();
    console.log(debitId);
    console.log(debtToUpdate.id);
    try {
      const update = await orchestrator.goToPreAbroves({
        isNewRoute: false,
        companyId: companyId,
        debt: debtToUpdate,
      });
      if (update.state.ok) {
        if (debtToUpdate.status !== "tentativa") {
          setMode("view")
        }
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
      setLoading(false);
      setTimeout(() => {
        setDialogOpen(true);
      }, 200);
    }
  };

  const handleUpdateDebt = async (debtToUpdate: Debt) => {
    if (!debtToUpdate || !debitId) return;

    setLoading(true); // 1️⃣ mostrar loading
    setDialogOpen(false); // aseguramos que esté cerrado

    try {
      const orchestrator = new DebtOrchestrator();

      console.log(debitId);
      console.log(debtToUpdate.id);

      const update = await orchestrator.updateSimpleDebt({
        isNewRoute: true,
        companyId: companyId,
        debt: debtToUpdate,
      });

      if (update.state.ok) {
        if (debtToUpdate.status !== "tentativa") {
          setMode("view")
        }
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

  const [mode, setMode] = useState<DebtFormMode>("view");
  const [form, setForm] = useState<Omit<Debt, "id"> | null>(null);

  useEffect(() => {
    const loadDebt = async () => {
      if (!debitId) return;

      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.getDebitById({
        idDebt: debitId,
        companyId: companyId,
      });

      if (result.state.ok) {
        //solo permite editar si la deuda esta en un estado tentativo o pre aprobado
        if (
          result.state.value?.status === "tentativa"
        ) {
          setMode("edit");
        } else {
          setMode("view");
        }

        setForm(result.state.value);
      } else {
        console.log(result.state.error);
      }
    };

    loadDebt();
  }, [debitId, companyId]);

  if (!form) return null;

  return (
    <Box p={3} mx="auto">
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
              Detalle de la deuda
            </Typography>
            {mode === "view" && (
              <Alert severity="warning" variant="outlined" sx={{ mb: 3 }}>
                Esta deuda no se puede editar porque no se encuentra en estado
                <strong> tentativo </strong>.
              </Alert>
            )}

            <DebtFormDataProvider getRoutes={true}>
              {({ routes, loading: formLoading }) => {
                if (formLoading) return <div>Cargando...</div>;

                return (
                  <>
                    <DebtForm
                      ref={formRef}
                      routes={routes}
                      debValues={mapDebtToForm(form as Debt)}
                      config={preaprovarCredito}
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                      {mode === "edit" && (
                        <>
                          {/* 
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => handleSubmit("update")}
                            disabled={loading}
                          >
                            Actualizar
                          </Button>
                          */}
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleSubmit("preApprove")}
                            disabled={loading}
                          >
                            Pre Aprobada
                          </Button>
                        </>
                      )}
                      <Button onClick={() => navigate(-1)} disabled={loading}>
                        Volver
                      </Button>
                    </Stack>
                  </>
                );
              }}
            </DebtFormDataProvider>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

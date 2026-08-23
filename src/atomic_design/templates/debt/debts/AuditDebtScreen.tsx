import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { createEmptyDebt, type Debt, type DebtStatus } from "../../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { LoadingOverlay } from "../../../molecules/LoadingOverlay";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { RenewalComparisonForm } from "../RenewalComparisonForm";
import { useRef } from "react";
import { DebtForm, mergeDebtWithForm, mapDebtToForm, type DebtFormRef, type DebtFormValues } from "../debtForm";
import { DebtFormDataProvider } from "./DebtFormDataProvider";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "../form/constsForm";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SimulateDebtResultCard } from "../../../molecules/SimulateDebtResultCard";
import { auditDebtConfig } from "../../../sub_atomic_particles/debFormConsts";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { selectActionAuditor } from "../../audit/helpers/selecActionAuditor";
import { MoneyTypography } from "../../../atoms/MoneyTypography";

export const AuditDebtScreen = () => {
  const debtFormRef = useRef<DebtFormRef>(null);
  /**
   * debt obtenido por id
   */
  const [debt, setDebt] = useState<Debt | null>(null);

  const actions = useMemo(() => {
    if (!debt) return [];
    return selectActionAuditor(debt.status);
  }, [debt]);



  const user = useAppSelector((state) => state.user.user);
  const isAdmin: boolean = user?.roles.includes("ADMIN") || false
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

  const [simulateDebtValues, setSimulateDebtValues] = useState<SimulateDebtOutput>(createEmptySimulateDebtOutput());

  const handleSubmitDebt = async (submitType: DebtSubmitType) => {
    setSimulateDebtValues(createEmptySimulateDebtOutput())
    let isValid: boolean = false;
    const formValues: DebtFormValues | undefined = debtFormRef.current?.getValues();
    if (!formValues) return;

    if (!debtFormRef.current) {
      return;
    }
    if (submitType === "crear") {
      isValid = await debtFormRef.current?.validate();
    } else {
      const fieldsToValidate: (keyof DebtFormValues)[] = formValues.calculationMode === "months"
        ? SIMULATION_FIELDS_INSTALLMENTS
        : SIMULATION_FIELDS_MONTHS;
      isValid = await debtFormRef.current?.validateFields(fieldsToValidate);
    }
    if (!isValid) return;

    const debt: Debt = mergeDebtWithForm(createEmptyDebt(), formValues);

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    console.log("se toma por meses?:", formValues?.calculationMode === "months")

    switch (submitType) {

      case "actualizar": {
        await handleUpdateDebt();
        break;
      }
      case "simular": {
        await handleSimulateDebt(debt, months);
        break;
      }
      default: {
        break;
      }
    }
  };
  const handleChangeStatus = async (nextStatus: DebtStatus): Promise<void> => {
    const orchestrator = new DebtOrchestrator();
    console.log("companyId", companyId)
    console.log("debt?.id", debt?.id)
    console.log("nextStatus", nextStatus)

    const result = await orchestrator.updateDebtStatus({
      companyId: companyId,
      idDebt: debt?.id ?? "",
      debtStatus: nextStatus,
    });

    console.log("result:", result)
    setDialogOpen(true);
    if (result.ok) {
      setDebt((prev) => ({
        ...(prev ?? createEmptyDebt()),
        status: nextStatus,
      }));

      setForm({
        ...debt!,
        status: nextStatus,
      });


      setDialogConfig({
        title: "Actualización exitosa",
        body: "La deuda fue actualizada correctamente.",
        buttonText: "Entendido",
      });
    } else {
      setDialogConfig({
        title: "Error al actualizar",
        body: result.error.code ?? "Ocurrió un error inesperado al actualizar la deuda.",
        buttonText: "Cerrar",
      });
    }
  }

  const handleSimulateDebt = async (data: Debt, months?: number) => {
    const orchestrator = new DebtOrchestrator();

    console.log("data:", data)
    console.log("months:", months)

    const result = await orchestrator.simulateDebt({
      debt: data,
      months: months,
    });

    if (result.ok) {
      setSimulateDebtValues(result.value)
    } else {
      console.log(result.error);

      setDialogOpen(true);
      setDialogConfig({
        title: "Error al simular la deuda",
        body: "Ocurrió un error al simular la deuda.",
        buttonText: "Entendido",
      });

    }
  };

  const handleUpdateDebt = async (updatedData?: Debt) => {
    if (!debt?.id) return;
    console.log("handleUpdateDebt")
    console.log(updatedData)
    console.log("debt obtenido")
    console.log(debt)

    setLoading(true);

    let debtToUpdate: Debt;
    var isNewRoute = false

    // Si recibimos updatedData, es porque venimos del submit de RenewalComparisonForm
    if (updatedData) {
      debtToUpdate = updatedData;
    } else {
      // En caso contrario, venimos del proceso normal de edición de la deuda que usa el form local
      if (!debtFormRef.current) {
        setLoading(false);
        return;
      }
      isNewRoute = debt.routeId === debtFormRef.current?.getValues().routeId
      debtToUpdate = mergeDebtWithForm(debt, debtFormRef.current?.getValues());
    }

    console.log("debtToUpdate:", debtToUpdate)

    try {
      const orchestrator = new DebtOrchestrator();

      debtToUpdate.id = debt.id;

      const update = await orchestrator.updateDebtUse({
        isNewRoute: isNewRoute,
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

  const [form, setForm] = useState<Debt | null>(null);
  const [originalDebt, setOriginalDebt] = useState<Debt | null>(null);

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
        console.log("currentDebt:", currentDebt)
        setDebt(currentDebt);
        setForm(currentDebt);

        if (currentDebt.status === "preAprobada" && currentDebt.originalDebt) {
          const originalResult = await orchestrator.getDebitById({
            idDebt: currentDebt.originalDebt,
            companyId: companyId,
          });

          if (originalResult.state.ok && originalResult.state.value) {
            setOriginalDebt(originalResult.state.value);
          } else {
            setDialogConfig({
              title: "Error al cargar la deuda",
              body: "Ocurrió un error inesperado al cargar la deuda original, por favor recarga la pagina",
              buttonText: "Cerrar",
            });
          }
        }
      } else {
        setDialogConfig({
          title: "Error al cargar la deuda",
          body: "Ocurrió un error inesperado al cargar la deuda.",
          buttonText: "Cerrar",
        });
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
                originalDebt={originalDebt}
                proposedDebt={form}
                mode="audit"
                onSubmit={handleUpdateDebt}
              />
            ) : (
              <DebtFormDataProvider getRoutes={true}>
                {({ routes, loading }) => {
                  if (loading) return <div>Cargando...</div>;

                  return (
                    <>
                      <DebtForm ref={debtFormRef} routes={routes} debValues={mapDebtToForm(form)} config={auditDebtConfig(isAdmin)} />

                      <MoneyTypography
                        label="Total de credito a pagar:"
                        value={debt?.amount ?? 0}
                        strong={false}
                      />
                      <Divider />

                      <Button onClick={() => handleSubmitDebt("actualizar")}>
                        Actualizar deuda
                      </Button>
                      <Button onClick={() => handleSubmitDebt("simular")}>
                        simular deuda
                      </Button>
                      {actions.map((action) => (
                        <Button
                          key={action.nextStatus}
                          variant="contained"
                          color={action.color}
                          onClick={() => handleChangeStatus(action.nextStatus)}
                        >
                          {action.label}
                        </Button>
                      ))}


                    </>
                  );
                }}
              </DebtFormDataProvider>
            )}
            {simulateDebtValues.capital > 0 && (
              <SimulateDebtResultCard data={simulateDebtValues} />
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
              <Button onClick={() => navigate(-1)} disabled={loading}>
                Volver
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <Button onClick={() => navigate(ScreenPaths.auditor.installments(debt?.id ?? ""))}>
            Ver cuotas
          </Button>
        </Card>
      </Box>
    </Box>
  );
};

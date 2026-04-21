import { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { createEmptyDebt, type Debt } from "../../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { LoadingOverlay } from "../../../molecules/LoadingOverlay";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { DebtForm, mergeDebtWithForm, mapDebtToForm, type DebtFormRef, type DebtFormValues } from "../../debt/debtForm2";
import { DebtFormDataProvider } from "../../debt/debts/DebtFormDataProvider";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "../../debt/form/constsForm";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SimulateDebtResultCard } from "../../../molecules/SimulateDebtResultCard";

export const AccountantDebtScreen = () => {
  const debtFormRef = useRef<DebtFormRef>(null);
  const [debt, setDebt] = useState<Debt | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useAppSelector((state: any) => state.user.user);
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

    const baseDebt: Debt = mergeDebtWithForm(createEmptyDebt(), formValues);

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    switch (submitType) {

      case "actualizar": {
        await handleUpdateDebt();
        break;
      }
      case "simular": {
        await handleSimulateDebt(baseDebt, months);
        break;
      }
      default: {
        break;
      }
    }
  };

  const handleSimulateDebt = async (data: Debt, months?: number) => {
    const orchestrator = new DebtOrchestrator();

    const result = await orchestrator.simulateDebt({
      debt: data,
      months: months,
    });

    if (result.ok) {
      setSimulateDebtValues(result.value)
    } else {
      setDialogOpen(true);
      setDialogConfig({
        title: "Error al simular la deuda",
        body: "Ocurrió un error al simular la deuda.",
        buttonText: "Entendido",
      });
    }
  };

  const handleUpdateDebt = async () => {
    if (!debt?.id) return;

    setLoading(true);

    if (!debtFormRef.current) {
      return;
    }

    const debtToUpdate: Debt = mergeDebtWithForm(debt, debtFormRef.current?.getValues());

    try {
      const orchestrator = new DebtOrchestrator();

      debtToUpdate.id = debt.id;

      const update = await orchestrator.updateDebtUse({
        isNewCollector: false,
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
        setDebt(currentDebt);
        setForm(currentDebt);
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
              Detalle de la deuda (Contador)
            </Typography>

            <DebtFormDataProvider getRoutes={true}>
              {({ routes, loading }) => {
                if (loading) return <div>Cargando...</div>;

                return (
                  <>
                    <DebtForm ref={debtFormRef} routes={routes} debValues={mapDebtToForm(form)} />

                    <Button onClick={() => handleSubmitDebt("actualizar")}>
                      Actualizar deuda
                    </Button>
                    <Button onClick={() => handleSubmitDebt("simular")}>
                      Simular deuda
                    </Button>
                  </>
                );
              }}
            </DebtFormDataProvider>

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
      </Box>
    </Box>
  );
};

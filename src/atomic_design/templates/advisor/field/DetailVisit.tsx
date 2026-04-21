import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import {
  useAppSelector,
} from "../../../../store/redux/coreRedux";
import { BaseDialog } from "../../../atoms/BaseDialog";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import { textFieldSX } from "../../../atoms/textFieldSX";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { DebtFormDataProvider } from "../../debt/debts/DebtFormDataProvider";
import { DebtForm, mergeDebtWithForm, type DebtFormRef, type DebtFormValues } from "../../debt/debtForm2";
import type { SimulateDebtOutput } from "../../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "../../debt/form/constsForm";
import type { DialogState } from "../../../sub_atomic_particles/DialogState";
import { MoneyTypography } from "../../../atoms/MoneyTypography";

export const FieldVisit = () => {
  const { visitId } = useParams<{ visitId?: string }>();

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });

  const formRef = useRef<DebtFormRef>(null);

  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<Partial<Debt>>({});
  const [isTentative, setIsTentative] = useState(true);

  const companyId = useAppSelector((state) => state.user.user?.companyId);
  const userId = useAppSelector((state) => state.user.user?.id || "");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const debtOrchestrator = useMemo(() => new DebtOrchestrator(), []);


  const [SimulateDebtValues, setSimulateDebtValues] =
    useState<SimulateDebtOutput>({
      cuotasCompletas: 0,
      totalAmount: 0,
      pago_cuota_reound: 0,
      pago_ultima_cuota: 0,
      capital: 0,
      totalInstallments: 0,
      valueOfInstallments: 0,
    });
  const navigate = useNavigate();


  /* ---------------- Cargar visita + deuda ---------------- */
  useEffect(() => {
    if (!visitId) return;

    const loadData = async () => {
      setLoading(true);

      const visitResult = await visitOrchestrator.getVisitById({
        idCompany: companyId ?? "",
        idUser: userId,
        idVisit: visitId,
      });

      if (!visitResult.state.ok || !visitResult.state.value) {
        setDialog({
          open: true,
          success: false,
          message: ('La visita no pudo ser cargada correctamente '),
        });
        return;
      }

      setVisit(visitResult.state.value);

      const debtResult = await debtOrchestrator.getByFilters({
        companyId: companyId ?? "",
        idVisit: visitId,
      });

      if (debtResult.ok && debtResult.value.state.length > 0) {
        const foundDebt = debtResult.value.state[0];
        setDebt(foundDebt);
        setDebtForm(foundDebt);
        setIsTentative(foundDebt.status === "tentativa");
      }

      setLoading(false);
    };

    loadData();
  }, [visitId, companyId, userId, visitOrchestrator, debtOrchestrator]);



  const handleUpdateDebt = async (preAprove: boolean, formDataOriginal: Debt) => {
    if (!debt?.id) return;

    setLoading(true);

    const updatedDebt: Debt = {
      ...debt,
      ...debtForm,
      ...formDataOriginal,
      ...(preAprove && { status: "preAprobada" }),
    };

    const result = await debtOrchestrator.updateDebtUse({
      companyId: companyId ?? "",
      isNewCollector: false,
      debt: updatedDebt,
    });

    if (!result.state.ok) {
      setDialog({
        open: true,
        success: false,
        message: ('La deuda no pudo ser actualizada correctamente '),
      });
    } else
      setDebt(updatedDebt);
    setDebtForm(updatedDebt);
    setIsTentative(updatedDebt.status === "tentativa");

    setDialog({
      open: true,
      success: true,
      message: (preAprove
        ? "La deuda fue preaprobada correctamente."
        : "La deuda fue actualizada correctamente."),
    });
    setLoading(false);
  }





  const handleSubmit = async (submitType: DebtSubmitType) => {
    setSimulateDebtValues(
      {
        cuotasCompletas: 0,
        totalAmount: 0,
        pago_cuota_reound: 0,
        pago_ultima_cuota: 0,
        capital: 0,
        totalInstallments: 0,
        valueOfInstallments: 0,
      }
    )
    let isValid: boolean = false;
    const formValues: DebtFormValues | undefined = formRef.current?.getValues();
    if (!formValues) return;

    if (!formRef.current) {
      return;
    }

    const fieldsToValidate: (keyof DebtFormValues)[] = formValues.calculationMode === "months"
      ? SIMULATION_FIELDS_INSTALLMENTS
      : SIMULATION_FIELDS_MONTHS;
    isValid = await formRef.current?.validateFields(fieldsToValidate);

    if (!isValid) return;



    if (!debt) return;
    const mergedDebt: Debt = mergeDebtWithForm(debt, formValues);

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    console.log("se toma por meses?:", formValues?.calculationMode === "months")

    switch (submitType) {
      case "actualizar": {
        await handleUpdateDebt(false, mergedDebt);
        break;
      }
      case "preAprobar": {
        await handleUpdateDebt(true, mergedDebt);
        break;
      }
      case "simular": {
        await handleSimulateDebt(mergedDebt, months);
        break;
      }
      default: {
        break;
      }
    }
  };

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

      setDialog({
        open: true,
        success: false,
        message:
          result.error.code === "el capital debe ser mayor a 1000"
            ? "El capital debe ser mayor a 1000"
            : "Ocurrió un error al simular la deuda.",
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visit) return null;

  return (
    <>
      <Box maxWidth={700} mx="auto" mt={4}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Nombre del cliente"
                value={visit.customerName}
                disabled
                sx={textFieldSX}
              />

              <TextField
                label="Cédula"
                value={visit.customerDocument}
                disabled
                sx={textFieldSX}
              />

              <TextField
                label="Dirección"
                value={visit.custumerAddres}
                disabled
                sx={textFieldSX}
              />

              <TextField
                label="Observaciones"
                multiline
                rows={3}
                value={visit.observations}
                disabled
                sx={textFieldSX}
              />
              <Button
                onClick={() => {
                  navigate(ScreenPaths.advisor.field.visit.customer2(visit.customerId))
                }}
              >
                ver detalles del cliente
              </Button>

              {debt && (

                <><Card>
                  <CardContent>
                    <DebtFormDataProvider getRoutes={isTentative}>
                      {({ routes, loading }) => {
                        if (loading) return <div>Cargando...</div>;
                        return (
                          <>
                            <DebtForm ref={formRef} routes={routes} />

                            <Button onClick={() => handleSubmit("simular")}>
                              simular deuda
                            </Button>

                            <Button
                              variant="contained"
                              disabled={!isTentative}
                              onClick={() => handleSubmit("actualizar")}
                            >
                              Guardar cambios de deuda
                            </Button>

                            <Button
                              variant="contained"
                              disabled={!isTentative}
                              onClick={() => handleSubmit("preAprobar")}
                            >
                              PreAprobar deuda
                            </Button>
                          </>
                        );
                      }}


                    </DebtFormDataProvider>
                  </CardContent>
                </Card>


                </>
              )}
            </Stack>
          </CardContent>
        </Card>
        {SimulateDebtValues.capital > 0 && (
          <Card sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
            <Typography variant="h6">Resultado de la simulación</Typography>

            <MoneyTypography
              label="Total capital + interés:"
              value={SimulateDebtValues.capital}
            />

            <MoneyTypography label="Valor de cuotas:" value={SimulateDebtValues.valueOfInstallments} />

            <MoneyTypography
              label="Valor de cuotas redondeadas:"
              value={SimulateDebtValues.pago_cuota_reound}
            />

            <Typography>el numero de cuotas sin aproximar es {SimulateDebtValues.totalInstallments}</Typography>
            <Typography>el numero de cuotas al aproximar {SimulateDebtValues.totalInstallments - SimulateDebtValues.cuotasCompletas}</Typography>
            <MoneyTypography
              label="Valor de la ultima cuota:"
              value={SimulateDebtValues.pago_ultima_cuota}
            />
          </Card>
        )}
      </Box>

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        butonText="Aceptar"
        onClick={() => setDialog({ open: false, success: false, message: "" })}
      />
    </>
  );
};

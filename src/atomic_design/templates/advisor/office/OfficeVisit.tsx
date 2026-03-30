import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import {
  useAppSelector,
} from "../../../../store/redux/coreRedux";
import {
  pathOfficeVisits,
  ScreenPaths,
} from "../../../../core/helpers/name_routes";
import { BaseDialog } from "../../../atoms/BaseDialog";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import { VisitForm } from "../../visit/VisitForm";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { createEmptyDebt, type Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { VisitFormDataProvider } from "../../visit/VisitFormDataProvider";
import { DebtFormDataProvider } from "../../debt/debts/DebtFormDataProvider";
import { DebtForm, mergeDebtWithForm, type DebtFormRef, type DebtFormValues } from "../../debt/debtForm2";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "../../debt/form/constsForm";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import type { DialogState } from "../../../sub_atomic_particles/DialogState";
import { SimulateDebtResultCard } from "../../../molecules/SimulateDebtResultCard";
import { debtFormReadOnlyConfig } from "../../../sub_atomic_particles/debFormConsts";

export const OfficeVisit = () => {
  const debtFormRef = useRef<DebtFormRef>(null);
  const { visitId } = useParams<{ visitId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [debt, setDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<Partial<Debt>>({});

  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);
  const [isTentative, setIsTentative] = useState(true);

  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [associatedDebt, setAssociatedDebt] = useState<Debt | undefined>(undefined);


  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userId = useAppSelector((state) => state.user.user?.id || "undefined");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const debtOrchestrator = useMemo(() => new DebtOrchestrator(), []);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });

  const [SimulateDebtValues, setSimulateDebtValues] =
    useState<SimulateDebtOutput>(createEmptySimulateDebtOutput());

  /* ------------------- Cargar visita ------------------- */
  useEffect(() => {
    if (!visitId) return;

    const loadVisit = async () => {
      setLoading(true);

      const result = await visitOrchestrator.getVisitById({
        idCompany: companyId,
        idUser: userId,
        idVisit: visitId,
      });

      console.log("visit state", result.state.ok);
      if (result.state.ok && result.state.value) {
        console.log("visit", result.state.value);
        setVisit(result.state.value);

        //añadir validacion sobre la visita para ahorrar consumos
        // Cargar deuda asociada
        const debtResult = await debtOrchestrator.getByFilters({
          companyId,
          idVisit: visitId
        });

        if (!debtResult.ok) {
          setDialog({
            open: true,
            success: false,
            message: "Error al cargar la deuda asociada",
          });
        }

        if (debtResult.ok && debtResult.value.state.length > 0) {
          setAssociatedDebt(debtResult.value.state[0]);
        }
      } else {
        setDialog({
          open: true,
          success: false,
          message: "Error al cargar la visita",
        });
      }

      setLoading(false);
    };

    loadVisit();
  }, [visitId, companyId, userId, visitOrchestrator]);

  const handleSubmitDebt = async (submitType: DebtSubmitType) => {
    setSimulateDebtValues(createEmptySimulateDebtOutput())
    let isValid: boolean = false;
    const formValues: DebtFormValues | undefined = debtFormRef.current?.getValues();
    if (!formValues) return;

    if (!debtFormRef.current) {
      5
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
      case "crear": {
        await handleCreateDebt(debt, months);
        break;
      }
      case "actualizar": {
        await handleUpdateDebt(false, debt);
        break;
      }
      case "preAprobar": {
        await handleUpdateDebt(true, debt);
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
          result.error.code === "el monton total debe ser mayor a 1000"
            ? "El monto debe ser mayor a 1000"
            : "Ocurrió un error al simular la deuda.",
      });
    }
  };

  const handleUpdateDebt = async (preAprove: boolean, formDataOriginal: Debt) => {
    if (!debt?.id) return;

    setLoading(true);

    const updatedDebt: Debt = {
      ...debt, // datos originales base
      ...debtForm, // datos de form guardados si hubiere
      ...formDataOriginal, // nuevos datos del formulario que se acaban de construir
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

  const handleCreateDebt = async (data: Debt, months?: number) => {
    const orchestrator = new DebtOrchestrator();
    console.log(data);

    const result = await orchestrator.createDebt({
      companyId,
      debt: data,
      months,
    });

    if (result.ok) {
      setDialog({
        open: true,
        success: true,
        message: ('La deuda fue creada correctamente con el nombre: ' + result.value.debtName),
      });
    } else {
      console.log(result.error);
      if (result.error.code == "CUSTOMER_NOT_FOUND") {
        setDialog({
          open: true,
          success: false,
          message: "no existe el cliente con la cedula dada",
        });
        return;
      }
      setDialog({
        open: true,
        success: false,
        message: "Ocurrió un error al crear la deuda.",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));

    if (isOfficeVisit) {
      navigate(ScreenPaths.advisor.office.visit.visits);
    } else {
      navigate(ScreenPaths.advisor.field.visit.visits);
    }
  };

  /* ------------------- Actualizar visita ------------------- */
  const handleUpdateVisit = async (updatedVisit: Visit) => {
    if (!companyId || !visitId) return;

    setLoading(true);

    const result = await visitOrchestrator.editVisit({
      idCompany: companyId,
      idUser: userId,
      visit: updatedVisit,
    });

    setLoading(false);

    let mesage = ""

    if (result.state.ok) {
      mesage = "Visita actualizada correctamente";
    } else if (result.state.error.code === "USER_NOT_FOUND") {
      mesage = "No se encontró un cliente con el documento indicado";
    } else {
      mesage = "No se pudo actualizar la visita";
    }

    setDialog({
      open: true,
      success: result.state.ok,
      message: mesage,
    });
  };

  if (loading || !visit) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box maxWidth={700} mx="auto" mt={4}>
        <Card>
          <CardContent>
            <VisitFormDataProvider getUsers={true}>
              {({ users, loading }) => {

                if (loading) return <div>Cargando...</div>;

                return (
                  <>
                    <VisitForm config={{
                      visibleFields: undefined,
                      editableFields: undefined,
                      requiredFields: undefined
                    }} advisors={users} visit={visit}
                    />
                    <Button onClick={() => handleUpdateVisit(visit)}>
                      Actualizar visita
                    </Button>
                  </>
                )
              }}
            </VisitFormDataProvider>

            {associatedDebt && (

              <DebtFormDataProvider getRoutes={true}>
                {({ routes, loading }) => {
                  if (loading) return <div>Cargando...</div>;

                  return (
                    <>
                      <DebtForm ref={debtFormRef} routes={routes} config={debtFormReadOnlyConfig} />
                      <Button onClick={() => handleSubmitDebt("simular")}>
                        simular deuda
                      </Button>
                      <Button onClick={() => handleSubmitDebt("crear")}>
                        Crear deuda
                      </Button>
                      <Button
                        variant="contained"
                        disabled={!isTentative}
                        onClick={() => handleSubmitDebt("actualizar")}
                      >
                        Guardar cambios de deuda
                      </Button>

                      <Button
                        variant="contained"
                        disabled={!isTentative}
                        onClick={() => handleSubmitDebt("preAprobar")}
                      > PreAprobar deuda
                      </Button>

                      {SimulateDebtValues.totalAmount > 0 && (
                        <SimulateDebtResultCard data={SimulateDebtValues} />
                      )}
                    </>
                  );
                }}
              </DebtFormDataProvider>

            )}
          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={dialog.open}
        title={dialog.success ? "Deuda creada" : "Error"}
        body={dialog.message}
        onClick={handleCloseDialog}
        butonText="Aceptar"
      />
    </>
  );
};

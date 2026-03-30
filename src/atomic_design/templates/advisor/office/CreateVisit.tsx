import { useMemo, useRef, useState } from "react";
import { VisitForm, type VisitFormRef } from "../../visit/VisitForm";
import {
  pathOfficeVisits,
  ScreenPaths,
} from "../../../../core/helpers/name_routes";
import { useLocation, useNavigate } from "react-router";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import { createEmptyDebt, type Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Switch } from "@mui/material";
import { VisitFormDataProvider } from "../../visit/VisitFormDataProvider";
import { DebtForm, mergeDebtWithForm, type DebtFormRef, type DebtFormValues } from "../../debt/debtForm2";
import { DebtFormDataProvider } from "../../debt/debts/DebtFormDataProvider";
import { SimulateDebtResultCard } from "../../../molecules/SimulateDebtResultCard";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "../../debt/form/constsForm";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { DialogState } from "../../../sub_atomic_particles/DialogState";
import { debtInCreateVisit } from "../../../sub_atomic_particles/debFormConsts";
import { visitConfig } from "../../../sub_atomic_particles/visitConfig";

export const CreateVisit = () => {

  const [includeDebt, setIncludeDebt] = useState(false);
  const [SimulateDebtValues, setSimulateDebtValues] =
    useState<SimulateDebtOutput>(createEmptySimulateDebtOutput());

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });


  const visitFromRef = useRef<VisitFormRef>(null);
  const debtFormRef = useRef<DebtFormRef>(null);

  const [debt, setDebt] = useState<Debt | null>(null);


  const location = useLocation();
  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userId = useAppSelector((state) => state.user.user?.id || "undefined");
  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const navigate = useNavigate();



  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);

  const [loading, setLoading] = useState(false);

  // deuda
  const handleSubmitDebt = async (submitType: DebtSubmitType): Promise<boolean> => {
    setSimulateDebtValues(createEmptySimulateDebtOutput())
    let isValid: boolean = false;
    const formValues: DebtFormValues | undefined = debtFormRef.current?.getValues();
    if (!formValues) return false;

    if (!debtFormRef.current) {
      return false;
    }
    if (submitType === "crear") {
      isValid = await debtFormRef.current?.validate();

    }
    if (submitType === "simular") {
      const fieldsToValidate: (keyof DebtFormValues)[] = formValues.calculationMode === "months"
        ? SIMULATION_FIELDS_INSTALLMENTS
        : SIMULATION_FIELDS_MONTHS;
      isValid = await debtFormRef.current?.validateFields(fieldsToValidate);
    }
    if (submitType === "actualizar") {
      isValid = await debtFormRef.current?.validate();
    }

    if (!isValid) return false;


    const debtForVreate: Debt = mergeDebtWithForm(createEmptyDebt(), formValues);

    setDebt(debtForVreate);

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    console.log("se toma por meses?:", formValues?.calculationMode === "months")

    switch (submitType) {
      case "simular": {
        await handleSimulateDebt(debtForVreate, months);
        break;
      }
      default: {
        break;
      }
    }
    return isValid;
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

  //crear visita
  const handleCreateVisit = async () => {

    const data = visitFromRef.current?.getValues();

    if (!companyId || !data) {
      setDialog({
        open: true,
        success: false,
        message: "error interno en el formulario",
      });
      return;
    }

    const isValid = await visitFromRef.current?.validateFields(["customerDocument", "userAssigned"])
    if (!isValid) {
      return;
    }

    //validar formulario
    if (includeDebt) {
      const isValid = await handleSubmitDebt("crear")
      if (!isValid) {
        setDialog({
          open: true,
          success: false,
          message: "formulario de deuda incorrecto",
        });
        return
      } else {
        setDebt((prev) =>
          prev
            ? { ...prev, costumerDocument: data.customerDocument }
            : prev
        );
      }
    } else {
      setDebt(null);
    }

    setLoading(true);

    /** 🔥 OBJETO FINAL (FUENTE DE LA VERDAD) */
    const visitToSave: Visit = {
      ...data,
      id: data.id || "frontID",
      state: data.state,
      createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    };



    let result;

    if (debt) {
      result = await visitOrchestrator.createVisitWithDebt({
        idCompany: companyId,
        idUser: userId,
        visit: visitToSave,
        debt: debt,
      });
    } else {
      result = await visitOrchestrator.createVisit({
        idCompany: companyId,
        idUser: userId,
        visit: visitToSave,
      });
    }

    setLoading(false);

    if (result.ok) {
      setDialog({
        open: true,
        success: true,
        message: debt ? "visita y deuda creadas correctamente" : "visita creada correctamente",
      });
      return;
    } else {
      if (result.error.code === "USER_NOT_FOUND") {
        setDialog({
          open: true,
          success: false,
          message: "no se encontro un cliente con el documento indicado",
        });
        setLoading(false);
        return;
      }
      setDialog({
        open: true,
        success: false,
        message: "no se pudo guardar la visita",
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
                    <VisitForm ref={visitFromRef} advisors={users} config={visitConfig} />
                    <Button onClick={() => handleCreateVisit()}>
                      crear visita
                    </Button>
                  </>
                )
              }}
            </VisitFormDataProvider>
          </CardContent>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!includeDebt}
                  onChange={(e) => setIncludeDebt(e.target.checked)}
                />
              }
              label="Deuda"
            />
          </Box>


          {includeDebt &&
            <CardContent>
              <DebtFormDataProvider>
                {({ routes, loading }) => {
                  if (loading) return <div>Cargando...</div>;
                  return (
                    <>
                      <DebtForm ref={debtFormRef} routes={routes} config={debtInCreateVisit} />

                      <Button onClick={() => handleSubmitDebt("simular")}>
                        simular deuda
                      </Button>
                    </>
                  )
                }}
              </DebtFormDataProvider>

              {SimulateDebtValues.totalAmount > 0 && (
                <SimulateDebtResultCard data={SimulateDebtValues} />
              )}

            </CardContent>
          }
        </Card>
      </Box>

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        title={dialog.success ? "Visita creada" : "Error"}
        butonText="Aceptar"
        onClick={() => {
          if (!dialog.success
          ) {
            setDialog((prev) => ({ ...prev, open: false }));
          } else {
            setDialog((prev) => ({ ...prev, open: false }));
            if (isOfficeVisit) {
              navigate(ScreenPaths.advisor.office.visit.visits);
            } else {
              navigate(ScreenPaths.advisor.field.visit.visits);
            }
          }
        }}
      />
    </>
  );
};

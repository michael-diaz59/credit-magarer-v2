import { useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { createEmptyDebt, type Debt } from "../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { BaseDialog } from "../../atoms/BaseDialog";
import { DebtForm, mergeDebtWithForm, type DebtFormRef, type DebtFormValues } from "./debtForm2";
import { DebtFormDataProvider } from "./debts/DebtFormDataProvider";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "./form/constsForm";
import type { DialogState } from "../../sub_atomic_particles/DialogState";
import { SimulateDebtResultCard } from "../../molecules/SimulateDebtResultCard";




export const CreateDebtScreen = () => {
  const formRef = useRef<DebtFormRef>(null);

  const [SimulateDebtValues, setSimulateDebtValues] =
    useState<SimulateDebtOutput>(createEmptySimulateDebtOutput());


  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId || "");

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });
  const handleSubmit = async (submitType: DebtSubmitType) => {
    setSimulateDebtValues(
      createEmptySimulateDebtOutput()
    )
    let isValid: boolean = false;
    const formValues: DebtFormValues | undefined = formRef.current?.getValues();
    if (!formValues) return;

    if (!formRef.current) {
      return;
    }
    if (submitType === "crear") {
      isValid = await formRef.current?.validate();
    } else {
      const fieldsToValidate: (keyof DebtFormValues)[] = formValues.calculationMode === "months"
        ? SIMULATION_FIELDS_INSTALLMENTS
        : SIMULATION_FIELDS_MONTHS;
      isValid = await formRef.current?.validateFields(fieldsToValidate);
    }
    if (!isValid) return;


    const debtForVreate: Debt = mergeDebtWithForm(createEmptyDebt(), formValues);

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    console.log("se toma por meses?:", formValues?.calculationMode === "months")

    switch (submitType) {
      case "crear": {
        await handleCreateDebt(debtForVreate, months);
        break;
      }
      case "simular": {
        await handleSimulateDebt(debtForVreate, months);
        break;
      }
      default: {
        break;
      }
    }
  };

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

  const handleCloseDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
    if (dialog.success) {
      navigate(ScreenPaths.advisor.office.debit.debits);
    }
  };

  return (
    <Box p={3} mx="auto">
      <BaseDialog
        open={dialog.open}
        title={dialog.success ? "Deuda creada" : "Error"}
        body={dialog.message}
        onClick={handleCloseDialog}
        butonText="Aceptar"
      />

      <Card>
        <CardContent>
          <Typography>crear deuda</Typography>

          <DebtFormDataProvider getRoutes={true}>
            {({ routes, loading }) => {
              if (loading) return <div>Cargando...</div>;

              return (
                <>
                  <DebtForm ref={formRef} routes={routes} />

                  <Button onClick={() => handleSubmit("crear")}>
                    Crear deuda
                  </Button>
                  <Button onClick={() => handleSubmit("simular")}>
                    simular deuda
                  </Button>
                </>
              );
            }}
          </DebtFormDataProvider>
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button onClick={() => navigate(-1)}>Cancelar</Button>
          </Stack>
        </CardContent>
      </Card>
      {SimulateDebtValues.totalAmount > 0 && (
        <SimulateDebtResultCard data={SimulateDebtValues} />
      )}
    </Box>
  );
};

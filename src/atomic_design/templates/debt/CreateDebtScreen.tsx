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
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { BaseDialog } from "../../atoms/BaseDialog";
import { DebtForm, type DebtFormRef } from "./debtForm2";
import { DebtFormDataProvider } from "./debts/DebtFormDataProvider";
import { MoneyTypography } from "../../atoms/MoneyTypography";
import type { SimulateDebtOutput } from "../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";

type DialogState = {
  open: boolean;
  success: boolean;
  message: string;
};

type submitType = "crear" | "simular";

export const CreateDebtScreen = () => {
  const formRef = useRef<DebtFormRef>(null);

  const [SimulateDebtValues, setSimulateDebtValues] =
    useState<SimulateDebtOutput>({
      cuotasCompletas: 0,
      pago_cuota_reound: 0,
      pago_ultima_cuota: 0,
      totalAmount: 0,
      totalInstallments: 0,
      valueOfInstallments: 0,
    });


  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId || "");

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });
  const handleSubmit = async (submitType: submitType) => {
    setSimulateDebtValues(
      {
        cuotasCompletas: 0,
        pago_cuota_reound: 0,
        pago_ultima_cuota: 0,
        totalAmount: 0,
        totalInstallments: 0,
        valueOfInstallments: 0,
      }
    )
    const isValid = await formRef.current?.validate();
    if (!isValid) return;

    const formValues = formRef.current?.getValues();
    if (!formValues) return;

    const debt: Debt = {
      id: "",
      collectorId: formValues.collectorId,
      costumerDocument: formValues.costumerDocument,
      type: formValues.type,
      totalAmount: formValues.totalAmount,
      debtTerms: formValues.debtTerms,
      interestRate: formValues.interestRate,
      installmentCount: formValues.installmentCount,
      startDate: formValues.startDate,
      status: "tentativa",
      clientId: "0",
      costumerName: "",
      createdAt: "",
      diasMes: formValues.diasMes,
      firstDueDate: "",
      idVisit: "",
      name: "",
      nextPaymentDue: "",
      overdueInstallmentsCount: 0,
      capital: formValues.totalAmount,
    };

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    switch (submitType) {
      case "crear": {
        await handleCreateDebt(debt, months);
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

          <DebtFormDataProvider>
            {({ collectors, loading }) => {
              if (loading) return <div>Cargando...</div>;

              return (
                <>
                  <DebtForm ref={formRef} collectors={collectors} />

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
        <Card sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
          <Typography variant="h6">Resultado de la simulación</Typography>

          <MoneyTypography
            label="Total capital + interés:"
            value={SimulateDebtValues.totalAmount}
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
  );
};

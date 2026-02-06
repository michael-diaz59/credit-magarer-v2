import { useState } from "react";
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
import { DebtForm } from "./DebtForm";
import type { DebtFormMode } from "./DebtFormMode";


type DialogState = {
  open: boolean;
  success: boolean;
  message: string;
};


export const CreateDebtScreen = () => {
  const navigate = useNavigate();
    const [mode] = useState<DebtFormMode>("create");
  const companyId = useAppSelector(
    (state) => state.user.user?.companyId || ""
  );

  const [form] = useState<Omit<Debt, "id">>({
    name: "",
    collectorId: "",
    clientId: "",
    costumerDocument: "",
    nextPaymentDue:"",
    overdueInstallmentsCount:0,
    costumerName: "",
    type: "credito",
    idVisit:"",
    debtTerms: "diario",
    status: "tentativa",
    interestRate: 0,
    totalAmount: 0,
    installmentCount: 1,
    startDate: "",
    firstDueDate: "",
    createdAt: new Date().toISOString().split("T")[0],
  });

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });

  const handleCreateDebt = async (data: Omit<Debt, "id">) => {
    const orchestrator = new DebtOrchestrator();
       console.log(data)

    const result = await orchestrator.createDebt({
      companyId,
      debt: data,
    });

    if (result.ok) {
      setDialog({
        open: true,
        success: true,
        message: "La deuda fue creada correctamente.",
      });
    } else {
      console.log(result.error)
      if(result.error.code=="CUSTOMER_NOT_FOUND"){
         setDialog({
        open: true,
        success: false,
        message: "no existe el cliente con la cedula dada",
      });
      return
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
    if (dialog.success) {
      navigate(ScreenPaths.advisor.office.debit.debits);
    }
  };

  return (
    <Box p={3} maxWidth={600} mx="auto">
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
           <DebtForm
              mode={mode}
              defaultValues={form}
              allowedActions={["create"]}
              onSubmit={(action, data) => {
                if (action === "create") handleCreateDebt(data);
                if(action!=="create"){console.log("llego algo inesperado")}
                
              }}
            />

          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            mt={3}
          >
            <Button onClick={() => navigate(-1)}>
              Cancelar
            </Button>

          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
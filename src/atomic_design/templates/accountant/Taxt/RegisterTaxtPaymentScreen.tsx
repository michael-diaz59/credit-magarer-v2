import React, { useRef, useState } from "react";
import { Box, Typography, Button, Card, CardContent, Divider, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import TaxtOrchestrator from "../../../../features/taxt/domain/infraestructure/TaxtOrchestrator";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { TaxtPaymentForm, type TaxtPaymentFormRef } from "../../../organisms/Taxt/TaxtPaymentForm";
import { TaxtFormDataProvider } from "./TaxtFormDataProvider";
import { BaseDialog } from "../../../atoms/BaseDialog";

export const RegisterTaxtPaymentScreen: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<TaxtPaymentFormRef>(null);
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");
  const userId = useAppSelector((state) => state.user.user?.id ?? "");

  const [dialog, setDialog] = useState({ open: false, success: false, message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formRef.current) return;

    const isValid = await formRef.current.validate();
    if (!isValid) return;

    setLoading(true);
    const values = formRef.current.getValues();
    const orchestrator = new TaxtOrchestrator();

    const result = await orchestrator.createTaxtPayment({
      companyId,
      ...values,
      userId,
      idProofOfPayment: "", // Will be handled by repo with the file
    });

    setLoading(false);

    if (result.ok) {
      setDialog({
        open: true,
        success: true,
        message: "El pago de impuestos ha sido registrado exitosamente.",
      });
    } else {
      setDialog({
        open: true,
        success: false,
        message: "Hubo un error al registrar el pago de impuestos.",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialog({ ...dialog, open: false });
    if (dialog.success) {
      navigate(ScreenPaths.accountant.taxtPayments);
    }
  };

  return (
    <Box p={4} maxWidth={900} mx="auto">
      <BaseDialog
        open={dialog.open}
        title={dialog.success ? "Registro Exitoso" : "Error"}
        body={dialog.message}
        onClick={handleCloseDialog}
        butonText="Aceptar"
      />

      <Typography variant="h4" fontWeight="bold" color="primary" mb={4}>
        Registrar Pago de Impuestos
      </Typography>

      <Card elevation={6} sx={{ borderRadius: 3, overflow: "visible" }}>
        <CardContent sx={{ p: 4 }}>
          <TaxtFormDataProvider>
            {({ bankAccounts, loading: loadingAccounts }) => (
              <>
                <TaxtPaymentForm ref={formRef} bankAccounts={bankAccounts} />
                
                <Divider sx={{ my: 4 }} />
                
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    sx={{ width: 120 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || loadingAccounts}
                    sx={{ width: 160, fontWeight: "bold" }}
                  >
                    {loading ? "Registrando..." : "Registrar Pago"}
                  </Button>
                </Stack>
              </>
            )}
          </TaxtFormDataProvider>
        </CardContent>
      </Card>
    </Box>
  );
};

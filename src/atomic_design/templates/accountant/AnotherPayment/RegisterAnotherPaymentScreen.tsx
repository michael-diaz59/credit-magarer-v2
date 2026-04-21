import React, { useRef, useState } from "react";
import { Box, Typography, Button, Card, CardContent, Divider, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import AnotherPaymentOrchestrator from "../../../../features/anotherPayment/domain/infraestructure/AnotherPaymentOrchestrator";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { AnotherPaymentForm, type AnotherPaymentFormRef } from "../../../organisms/AnotherPayment/AnotherPaymentForm";
import { AnotherPaymentFormDataProvider } from "./AnotherPaymentFormDataProvider";
import { BaseDialog } from "../../../atoms/BaseDialog";

export const RegisterAnotherPaymentScreen: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<AnotherPaymentFormRef>(null);
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
    const orchestrator = new AnotherPaymentOrchestrator();

    const result = await orchestrator.createAnotherPayment({
      companyId,
      ...values,
      userId,
      idProofOfPayment: "",
    });

    setLoading(false);

    if (result.ok) {
      setDialog({
        open: true,
        success: true,
        message: "El pago adicional ha sido registrado exitosamente.",
      });
    } else {
      setDialog({
        open: true,
        success: false,
        message: "Hubo un error al registrar el pago adicional.",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialog({ ...dialog, open: false });
    if (dialog.success) {
      navigate(ScreenPaths.accountant.anotherPayments);
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
        Registrar Otros Pagos
      </Typography>

      <Card elevation={6} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <AnotherPaymentFormDataProvider>
            {({ bankAccounts, loading: loadingAccounts }) => (
              <>
                <AnotherPaymentForm ref={formRef} bankAccounts={bankAccounts} />
                
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
          </AnotherPaymentFormDataProvider>
        </CardContent>
      </Card>
    </Box>
  );
};

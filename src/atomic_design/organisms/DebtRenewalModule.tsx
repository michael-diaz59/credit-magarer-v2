import React, { useRef, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Stack,
    Box,
    Typography,
    Card,
    CardContent,
} from "@mui/material";
import { MoneyTypography } from "../atoms/MoneyTypography";
import { BaseDialog } from "../atoms/BaseDialog";
import { useNavigate } from "react-router-dom";
import { ScreenPaths } from "../../core/helpers/name_routes";
import { DebtForm, type DebtFormRef } from "../templates/debt/debtForm2";
import { DebtFormDataProvider } from "../templates/debt/debts/DebtFormDataProvider";
import DebtOrchestrator from "../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import type { SimulateDebtOutput } from "../../features/debits/domain/business/useCases/debt/SimulateDebtCase";

interface DebtRenewalModuleProps {
    companyId: string;
    currentDebt: Debt;
    totalPaid: number;
    remainingBalance: number;
    context: "auditor" | "collector" | "advisor";
    onSuccess?: () => void;
    buttonVariant?: "contained" | "outlined" | "text";
    buttonText?: string;
    buttonColor?: "primary" | "secondary" | "success" | "error" | "info" | "warning" | "inherit";
}

export const DebtRenewalModule: React.FC<DebtRenewalModuleProps> = ({
    companyId,
    currentDebt,
    totalPaid,
    remainingBalance,
    context,
    onSuccess,
    buttonVariant = "outlined",
    buttonText = "Renovar Deuda",
    buttonColor = "primary",
}) => {
    const navigate = useNavigate();
    const renewalFormRef = useRef<DebtFormRef>(null);
    const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [renewing, setRenewing] = useState(false);
    const [simulateResult, setSimulateResult] = useState<SimulateDebtOutput | null>(null);

    // Result Dialog State
    const [resultDialogOpen, setResultDialogOpen] = useState(false);
    const [resultMessage, setResultMessage] = useState("");

    const [redirectionOpen, setRedirectionOpen] = useState(false);
    const [renewalDebtName, setRenewalDebtName] = useState("");

    const handleOpenRenewal = async () => {
        console.log("currentDebt", currentDebt);
        console.log("renewedToDebtId", currentDebt.renewedToDebtId);
        if (currentDebt.renewedToDebtId) {
            try {
                const orchestrator = new DebtOrchestrator();
                const result = await orchestrator.getDebitById({
                    idDebt: currentDebt.renewedToDebtId,
                    companyId: companyId,
                });
                if (result.state.ok && result.state.value) {
                    setRenewalDebtName(result.state.value.name || result.state.value.id);
                }
            } catch (error) {
                console.error("Error fetching renewal debt info", error);
            }
            setRedirectionOpen(true);
            return;
        }
        setRenewalDialogOpen(true);
    };

    const handleSimulateRenewal = async () => {
        const isValid = await renewalFormRef.current?.validate();
        if (!isValid) return;

        const values = renewalFormRef.current?.getValues();
        if (!values) return;

        try {
            setSimulating(true);
            const orchestrator = new DebtOrchestrator();
            const result = await orchestrator.simulateDebt({
                debt: {
                    ...values,
                    id: "",
                    status: context === "auditor" ? "activa" : "preAprobada",
                    clientId: currentDebt.clientId,
                    costumerName: currentDebt.costumerName,
                    createdAt: new Date().toISOString().slice(0, 10),
                    firstDueDate: "",
                    idVisit: "",
                    name: "",
                    nextPaymentDue: "",
                    overdueInstallmentsCount: 0,
                    capital: values.totalAmount,
                    originalDebt: null,
                    dateLastPayment: "",
                    installmentsPaid: 0,
                } as unknown as Debt,
                months: values.calculationMode === "months" ? values.months : undefined,
            });

            if (result.ok) {
                setSimulateResult(result.value);
            } else {
                setResultMessage("Error al simular la renovación.");
                setResultDialogOpen(true);
            }
        } catch (error) {
            console.error("Error simulando renovación", error);
        } finally {
            setSimulating(false);
        }
    };

    const handleConfirmRenewal = async () => {
        const isValid = await renewalFormRef.current?.validate();
        if (!isValid) return;

        const values = renewalFormRef.current?.getValues();
        if (!values) return;

        try {
            setRenewing(true);
            const orchestrator = new DebtOrchestrator();
            const result = await orchestrator.createDebt({
                companyId,
                debt: {
                    ...values,
                    id: "",
                    status: context === "auditor" ? "activa" : "preAprobada",
                    clientId: currentDebt.clientId,
                    costumerName: currentDebt.costumerName,
                    createdAt: new Date().toISOString().slice(0, 10),
                    firstDueDate: "",
                    idVisit: "",
                    name: "",
                    nextPaymentDue: "",
                    overdueInstallmentsCount: 0,
                    capital: values.totalAmount,
                    originalDebt: currentDebt.id,
                    dateLastPayment: "",
                    installmentsPaid: 0,
                } as unknown as Debt,
                months: values.calculationMode === "months" ? values.months : undefined,
            });

            if (result.ok) {
                setRenewalDialogOpen(false);
                setResultMessage(`Renovación creada con éxito: ${result.value.debtName}`);
                setResultDialogOpen(true);
                if (onSuccess) onSuccess();
            } else {
                setResultMessage("Error al confirmar la renovación.");
                setResultDialogOpen(true);
            }
        } catch (error) {
            console.error("Error renovando deuda", error);
        } finally {
            setRenewing(false);
        }
    };

    return (
        <>
            <Button
                variant={buttonVariant}
                color={buttonColor}
                onClick={handleOpenRenewal}
            >
                {buttonText}
            </Button>

            <BaseDialog
                open={resultDialogOpen}
                body={resultMessage}
                onClick={() => setResultDialogOpen(false)}
                butonText="Aceptar"
            />

            <BaseDialog
                open={redirectionOpen}
                title="Deuda ya renovada"
                body={
                    context === "collector" ? (
                        <Typography>
                            Esta deuda ya fue renovada bajo el nombre de{" "}
                            <strong>{renewalDebtName}</strong>.
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            <Typography>
                                Esta deuda ya fue renovada. ¿Deseas ver la nueva deuda?
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setRedirectionOpen(false);
                                    navigate(ScreenPaths.auditor.debit(currentDebt.renewedToDebtId!));
                                }}
                            >
                                Ver Renovación
                            </Button>
                        </Stack>
                    )
                }
                onClick={() => setRedirectionOpen(false)}
                butonText="Cerrar"
            />

            <Dialog
                open={renewalDialogOpen}
                onClose={() => !renewing && setRenewalDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Renovación de Deuda</DialogTitle>
                <DialogContent>
                    <Box mb={3} p={2} border="1px solid" borderColor="divider" borderRadius={2} bgcolor="grey.50">
                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                            Resumen de Deuda Actual
                        </Typography>
                        <Stack direction="row" spacing={4}>
                            <MoneyTypography label="Monto Pagado:" value={totalPaid} />
                            <MoneyTypography label="Saldo Pendiente:" value={remainingBalance} />
                        </Stack>
                    </Box>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Renovación de Deuda</Typography>
                            <DebtFormDataProvider>
                                {({ collectors, loading: loadingCollectors }) => {
                                    if (loadingCollectors) return <CircularProgress />;
                                    return (
                                        <Stack spacing={3}>
                                            <DebtForm
                                                ref={renewalFormRef}
                                                collectors={collectors}
                                                defaultValues={{
                                                    collectorId: currentDebt.collectorId || "",
                                                    costumerDocument: currentDebt.costumerDocument || "",
                                                    totalAmount: currentDebt.capital || 0,
                                                    interestRate: currentDebt.interestRate || 0,
                                                    type: currentDebt.type || "credito",
                                                    debtTerms: currentDebt.debtTerms || "diario",
                                                    diasMes: currentDebt.diasMes || 24,
                                                    installmentCount: currentDebt.installmentCount || 1,
                                                    startDate: new Date().toISOString().slice(0, 10),
                                                    calculationMode: "installments",
                                                }}
                                            />
                                        </Stack>
                                    );
                                }}
                            </DebtFormDataProvider>
                        </CardContent>
                    </Card>

                    {simulateResult && (
                        <Card sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
                            <Typography variant="h6">Resultado de la simulación</Typography>

                            <MoneyTypography
                                label="Total capital + interés:"
                                value={simulateResult.totalAmount}
                            />

                            <MoneyTypography label="Valor de cuotas:" value={simulateResult.valueOfInstallments} />

                            <MoneyTypography
                                label="Valor de cuotas redondeadas:"
                                value={simulateResult.pago_cuota_reound}
                            />

                            <Typography>el numero de cuotas sin aproximar es {simulateResult.totalInstallments}</Typography>
                            <Typography>el numero de cuotas al aproximar {simulateResult.totalInstallments - simulateResult.cuotasCompletas}</Typography>
                            <MoneyTypography
                                label="Valor de la ultima cuota:"
                                value={simulateResult.pago_ultima_cuota}
                            />
                        </Card>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenewalDialogOpen(false)} disabled={renewing}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSimulateRenewal} color="secondary" disabled={renewing || simulating}>
                        {simulating ? <CircularProgress size={24} /> : "Simular renovación"}
                    </Button>
                    <Button
                        onClick={handleConfirmRenewal}
                        variant="contained"
                        disabled={renewing || !simulateResult}
                    >
                        {renewing ? <CircularProgress size={24} /> : "Confirmar Renovación"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

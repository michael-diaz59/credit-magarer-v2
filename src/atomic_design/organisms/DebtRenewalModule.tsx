import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { DebtForm, mapDebtToForm, type DebtFormRef } from "../templates/debt/debtForm";
import { DebtFormDataProvider } from "../templates/debt/debts/DebtFormDataProvider";
import DebtOrchestrator from "../../features/debits/domain/infraestructure/DebtOrchestrator";
import { createEmptyDebt, type Debt } from "../../features/debits/domain/business/entities/Debt";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SimulateDebtResultCard } from "../molecules/SimulateDebtResultCard";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";
import { calculateDebtRenewalFinancialSummary } from "../../features/debits/domain/business/services/calculateDebtRenewalFinancialSummary";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../features/debits/domain/infraestructure/installmentsOrchestrator";

interface DebtRenewalModuleProps {
    companyId: string;
    currentDebt: Debt;
    totalPaid?: number;
    remainingBalance?: number;
    installments?: Installment[];
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
    installments,
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

    const [localInstallments, setLocalInstallments] = useState<Installment[]>(installments ?? []);

    useEffect(() => {
        if (installments && installments.length > 0) {
            setLocalInstallments(installments);
        }
    }, [installments]);

    const activeInstallments = installments && installments.length > 0 ? installments : localInstallments;

    const summary = useMemo(() => {
        return calculateDebtRenewalFinancialSummary(currentDebt, activeInstallments);
    }, [currentDebt, activeInstallments]);

    const [SimulateDebtValues, setSimulateDebtValues] =
        useState<SimulateDebtOutput>(createEmptySimulateDebtOutput());

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

        if ((!installments || installments.length === 0) && currentDebt?.id) {
            try {
                const instOrch = new InstallmentsOrchestrator();
                const instRes = await instOrch.getByDebt({
                    debtId: currentDebt.id,
                    companyId,
                });
                if (instRes.state.ok) {
                    setLocalInstallments(instRes.state.value);
                }
            } catch (error) {
                console.error("Error fetching installments for renewal summary", error);
            }
        }

        setRenewalDialogOpen(true);
    };

    const handleSimulateRenewal = async () => {
        setSimulateDebtValues(
            createEmptySimulateDebtOutput()
        )
        const isValid = await renewalFormRef.current?.validate();
        if (!isValid) return;

        const values = renewalFormRef.current?.getValues();
        if (!values) return;

        try {
            setSimulating(true);
            const orchestrator = new DebtOrchestrator();
            const result = await orchestrator.simulateDebt({
                debt: {
                    ...createEmptyDebt(),
                    ...values,
                    status: context === "auditor" ? "activa" : "preAprobada",
                    clientId: currentDebt.clientId,
                    costumerName: currentDebt.clientName,
                    createdAt: new Date().toISOString().slice(0, 10),
                    capital: values.capital,
                    originalDebt: null,
                } as unknown as Debt,
                months: values.calculationMode === "months" ? values.months : undefined,
            });

            if (result.ok) {
                setSimulateDebtValues(result.value)
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
            const initialDebt: Debt = {
                ...createEmptyDebt(),
                ...values,
                status: context === "auditor" ? "activa" : "preAprobada",
                clientId: currentDebt.clientId,
                costumerName: currentDebt.clientName,
                createdAt: new Date().toISOString().slice(0, 10),
                capital: values.capital,
                originalDebt: currentDebt.id,
            } as unknown as Debt




            const result = await orchestrator.createDebt2({
                companyId,
                debt: initialDebt,
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
                    <Box mb={3} p={2.5} border="1px solid" borderColor="divider" borderRadius={2} bgcolor="grey.50">
                        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                            Resumen Financiero del Crédito a Renovar
                        </Typography>

                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={{ xs: 2, md: 3 }}
                            sx={{ mb: 2, pb: 2, borderBottom: "1px dashed", borderColor: "divider" }}
                        >
                            {/* Capital */}
                            <Box flex={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                    🏦 Capital
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Pactado: <strong>${FormatNumberToMoney(summary.contractCapital)}</strong>
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    Pagado: <strong>${FormatNumberToMoney(summary.capitalPaid)}</strong>
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color={summary.capitalPending > 0 ? "error.main" : "text.secondary"}
                                >
                                    Por Pagar: <strong>${FormatNumberToMoney(summary.capitalPending)}</strong>
                                </Typography>
                            </Box>

                            {/* Interés */}
                            <Box flex={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                    📈 Interés
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Pactado: <strong>${FormatNumberToMoney(summary.contractInterest)}</strong>
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    Pagado: <strong>${FormatNumberToMoney(summary.interestPaid)}</strong>
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color={summary.interestPending > 0 ? "error.main" : "text.secondary"}
                                >
                                    Por Pagar: <strong>${FormatNumberToMoney(summary.interestPending)}</strong>
                                </Typography>
                            </Box>

                            {/* Mora (Arrears) */}
                            <Box flex={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                    ⚠️ Mora (Arrears)
                                </Typography>
                                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                                    Pagada: <strong>${FormatNumberToMoney(summary.arrearsPaid)}</strong>
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color={summary.arrearsPending > 0 ? "error.main" : "text.secondary"}
                                >
                                    Por Pagar: <strong>${FormatNumberToMoney(summary.arrearsPending)}</strong>
                                </Typography>
                            </Box>

                            {/* Aplazamiento (Deferment) */}
                            <Box flex={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                    ⏱️ Aplazamiento (Deferment)
                                </Typography>
                                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                                    Pagado: <strong>${FormatNumberToMoney(summary.defermentPaid)}</strong>
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color={summary.defermentPending > 0 ? "warning.main" : "text.secondary"}
                                >
                                    Por Pagar: <strong>${FormatNumberToMoney(summary.defermentPending)}</strong>
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                            <MoneyTypography label="Total Pagado Real:" value={totalPaid !== undefined ? totalPaid : summary.totalPaid} />
                            <MoneyTypography
                                label="Total Saldo por Pagar:"
                                value={remainingBalance !== undefined ? remainingBalance : summary.totalPending}
                                sx={{ color: "primary.main", fontWeight: "bold" }}
                            />
                        </Stack>
                    </Box>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Renovación de Deuda</Typography>
                            <DebtFormDataProvider>
                                {({ routes, loading: loadingCollectors }) => {
                                    if (loadingCollectors) return <CircularProgress />;
                                    return (
                                        <Stack spacing={3}>
                                            <DebtForm
                                                ref={renewalFormRef}
                                                routes={routes}
                                                debValues={mapDebtToForm(currentDebt)}
                                            />
                                        </Stack>
                                    );
                                }}
                            </DebtFormDataProvider>
                        </CardContent>
                    </Card>

                    {SimulateDebtValues.capital > 0 && (
                        <SimulateDebtResultCard data={SimulateDebtValues} />
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
                        disabled={renewing || !SimulateDebtValues}
                    >
                        {renewing ? <CircularProgress size={24} /> : "Confirmar Renovación"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

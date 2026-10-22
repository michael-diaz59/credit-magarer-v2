import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Card,
    Chip,
    CircularProgress,
    Collapse,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment, InstallmentStatus } from "../../../features/debits/domain/business/entities/Installment";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { processInstallments, type ProcessedInstallment } from "../../../core/helpers/installments/getFirstPayableInstallment";
import { DebtRenewalModule } from "../../organisms/DebtRenewalModule";
import { calculateDebtRenewalFinancialSummary } from "../../../features/debits/domain/business/services/calculateDebtRenewalFinancialSummary";
import FormatNumberToMoney from "../../sub_atomic_particles/FormatNumberToMoney";

export const CollectorDebtInstallmentsScreen = () => {
    const { debtId } = useParams<{ debtId: string }>();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.user.user);
    const companyId = user?.companyId ?? "";

    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [debt, setDebt] = useState<Debt | null>(null);
    const [processedInstallments, setProcessedInstallments] = useState<ProcessedInstallment[]>([]);
    const [showSummary, setShowSummary] = useState(true);

    const fetchInstallments = async () => {
        if (!debtId || !companyId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const installmentOrchestrator = new InstallmentsOrchestrator();
            const debtOrchestrator = new DebtOrchestrator();

            const [instResult, debtResult] = await Promise.all([
                installmentOrchestrator.getByDebt({
                    debtId,
                    companyId,
                }),
                debtOrchestrator.getDebitById({
                    idDebt: debtId,
                    companyId,
                }),
            ]);

            if (instResult.state.ok) {
                setInstallments(instResult.state.value);
                setProcessedInstallments(processInstallments(instResult.state.value));
            }
            if (debtResult.state.ok) {
                setDebt(debtResult.state.value);
            }
        } catch (error) {
            console.error("Error cargando cuotas y detalles de la deuda", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstallments();
    }, [debtId, companyId]);

    const financialSummary = useMemo(() => {
        return calculateDebtRenewalFinancialSummary(debt, installments);
    }, [debt, installments]);

    const isRenewable = useMemo(() => {
        return (
            installments.length > 0 &&
            installments.filter((i) => i.status === "negociada" || i.status === "pagada").length >=
                installments.length / 2
        );
    }, [installments]);

    const getStatusColor = (status: InstallmentStatus) => {
        if (status === "pendiente") return "error";
        return "success";
    };

    const getStatusLabel = (status: InstallmentStatus, paymentDate: Date) => {
        const now = new Date();
        const isExpired = paymentDate < new Date(now.setDate(now.getDate() - 1));

        if (status === "pagada") return "pagada";
        if (status === "negociada") return "negociada";
        if (status === "adelantada") return "pagada";
        if (status === "renovada") return "pagada";
        if (status === "pendiente") {
            if (isExpired) return "mora";
            return "pendiente";
        }
        return "pendiente";
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    const sortedInstallments = [...installments].sort(
        (a, b) => a.installmentNumber - b.installmentNumber,
    );

    return (
        <Box p={2}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                mb={2}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5">Cuotas de la Deuda</Typography>
                    {isRenewable && (
                        <Chip
                            label="Cliente Renovable"
                            color="success"
                            size="small"
                            sx={{
                                fontWeight: "bold",
                                background: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
                                color: "white",
                            }}
                        />
                    )}
                </Stack>

                {debt && (
                    <DebtRenewalModule
                        companyId={companyId}
                        currentDebt={debt}
                        installments={installments}
                        totalPaid={financialSummary.totalPaid}
                        remainingBalance={financialSummary.totalPending}
                        context="collector"
                        buttonVariant="contained"
                        buttonColor="secondary"
                        buttonText="Renovar Deuda"
                        onSuccess={fetchInstallments}
                    />
                )}
            </Stack>

            {sortedInstallments.length > 0 && (
                <Box mb={2} px={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {sortedInstallments[0].clientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        CC: {sortedInstallments[0].clientDocument}
                    </Typography>
                </Box>
            )}

            {/* Resumen Financiero del Crédito */}
            <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: "grey.50" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Resumen Financiero del Crédito
                    </Typography>
                    <IconButton size="small" onClick={() => setShowSummary((prev) => !prev)}>
                        {showSummary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Stack>

                <Collapse in={showSummary}>
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
                                Pactado: <strong>${FormatNumberToMoney(financialSummary.contractCapital)}</strong>
                            </Typography>
                            <Typography variant="body2" color="success.main">
                                Pagado: <strong>${FormatNumberToMoney(financialSummary.capitalPaid)}</strong>
                            </Typography>
                            <Typography
                                variant="body2"
                                color={financialSummary.capitalPending > 0 ? "error.main" : "text.secondary"}
                            >
                                Por Pagar: <strong>${FormatNumberToMoney(financialSummary.capitalPending)}</strong>
                            </Typography>
                        </Box>

                        {/* Interés */}
                        <Box flex={1}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                📈 Interés
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Pactado: <strong>${FormatNumberToMoney(financialSummary.contractInterest)}</strong>
                            </Typography>
                            <Typography variant="body2" color="success.main">
                                Pagado: <strong>${FormatNumberToMoney(financialSummary.interestPaid)}</strong>
                            </Typography>
                            <Typography
                                variant="body2"
                                color={financialSummary.interestPending > 0 ? "error.main" : "text.secondary"}
                            >
                                Por Pagar: <strong>${FormatNumberToMoney(financialSummary.interestPending)}</strong>
                            </Typography>
                        </Box>

                        {/* Mora (Arrears) */}
                        <Box flex={1}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                ⚠️ Mora (Arrears)
                            </Typography>
                            <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                                Pagada: <strong>${FormatNumberToMoney(financialSummary.arrearsPaid)}</strong>
                            </Typography>
                            <Typography
                                variant="body2"
                                color={financialSummary.arrearsPending > 0 ? "error.main" : "text.secondary"}
                            >
                                Por Pagar: <strong>${FormatNumberToMoney(financialSummary.arrearsPending)}</strong>
                            </Typography>
                        </Box>

                        {/* Aplazamiento (Deferment) */}
                        <Box flex={1}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                                ⏱️ Aplazamiento (Deferment)
                            </Typography>
                            <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                                Pagado: <strong>${FormatNumberToMoney(financialSummary.defermentPaid)}</strong>
                            </Typography>
                            <Typography
                                variant="body2"
                                color={financialSummary.defermentPending > 0 ? "warning.main" : "text.secondary"}
                            >
                                Por Pagar: <strong>${FormatNumberToMoney(financialSummary.defermentPending)}</strong>
                            </Typography>
                        </Box>
                    </Stack>
                </Collapse>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} flexWrap="wrap">
                    <Typography variant="body2">
                        Total Pagado Real: <strong>${FormatNumberToMoney(financialSummary.totalPaid)}</strong>
                    </Typography>
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                        Total Saldo por Pagar: <strong>${FormatNumberToMoney(financialSummary.totalPending)}</strong>
                    </Typography>
                </Stack>
            </Card>

            <Stack spacing={2}>
                {processedInstallments.map((i) => (
                    <Box
                        key={i.id}
                        p={2}
                        border="1px solid"
                        borderColor={i.isActive ? "primary.main" : "divider"}
                        borderRadius={2}
                        sx={{
                            cursor: i.isSelectable ? "pointer" : "not-allowed",
                            opacity: i.isSelectable || i.isPaid ? 1 : 0.45,
                            backgroundColor: "background.paper",
                            "&:hover": i.isSelectable
                                ? { backgroundColor: "action.hover" }
                                : {},
                        }}
                        onClick={() => {
                            if (!i.isSelectable) return;
                            navigate(ScreenPaths.collector.installment(i.id));
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography fontWeight="500">
                                Cuota #{i.installmentNumber}
                            </Typography>

                            <Stack direction="row" spacing={1}>
                                {i.isActive && (
                                    <Chip
                                        label="Cuota actual"
                                        color="primary"
                                        size="small"
                                    />
                                )}

                                <Chip
                                    label={getStatusLabel(i.status, new Date(i.dueDate))}
                                    color={getStatusColor(i.status)}
                                    size="small"
                                    variant="outlined"
                                />
                            </Stack>
                        </Stack>

                        <Typography variant="h6" color="primary.main">
                            ${i.amount.toLocaleString()}
                        </Typography>

                        <Stack direction="row" justifyContent="space-between" mt={1}>
                            <Typography variant="body2" color="text.secondary">
                                Vence: {new Date(i.dueDate).toLocaleDateString()}
                            </Typography>

                            {i.amountPaid > 0 && (
                                <Typography variant="body2" color="success.main">
                                    Pagado: ${i.amountPaid.toLocaleString()}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};


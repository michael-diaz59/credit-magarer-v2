import { useMemo, useState, useEffect } from "react";
import {
    Box,
    Typography,
    Container,
    Alert,
    Grid,
    Card,
    CardContent,
    Stack,
    Chip,
    LinearProgress,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/redux/coreRedux";
import { useFirestorePagination } from "../../../features/debits/provider/firebase/useFirestorePagination";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import type { DebtPaymentCapacity } from "../../../features/debits/domain/business/services/calculateDebtPaymentCapacity";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { getLocalDate } from "../../../core/helpers/dates/calculateDays";
import FormatNumberToMoney from "../../sub_atomic_particles/FormatNumberToMoney";
import { DebtListAccountant } from "../../molecules/DebtList";
import { CustomSx } from "../../sub_atomic_particles/Custom_sx";

export function AccountantDebtsScreen() {
    const navigate = useNavigate();
    const companyId = useAppSelector((state) => state.user.user?.companyId);

    const installmentsOrchestrator = useMemo(
        () => new InstallmentsOrchestrator(),
        []
    );

    const [capacities, setCapacities] = useState<Record<string, DebtPaymentCapacity>>({});
    const [loadingCapacities, setLoadingCapacities] = useState(false);

    const {
        data: debts,
        loading,
        loadMore,
        hasMore,
    } = useFirestorePagination({
        path: `companies/${companyId}/debts`,
        pageSize: 15,
        orderBy: [{ field: "startDate", direction: "desc" }],
        filters: [{ field: "deliveredStatus", op: "==", value: "entregado" }],
    });

    useEffect(() => {
        if (!companyId || debts.length === 0) return;

        const debtsToFetch = debts.filter((d) => !capacities[d.id]);
        if (debtsToFetch.length === 0) return;

        let isMounted = true;
        const fetchCapacities = async () => {
            setLoadingCapacities(true);
            const todayDateStr = getLocalDate(new Date());

            const result = await installmentsOrchestrator.getDebtsPaymentCapacities({
                companyId,
                debts: debtsToFetch,
                todayDateStr,
            });

            if (isMounted && result.ok) {
                setCapacities((prev) => ({
                    ...prev,
                    ...result.value.capacities,
                }));
            }
            if (isMounted) {
                setLoadingCapacities(false);
            }
        };

        fetchCapacities();

        return () => {
            isMounted = false;
        };
    }, [debts, companyId, installmentsOrchestrator]);

    const totals = useMemo(() => {
        let totalBase = 0;
        let totalArrears = 0;
        let totalDeferment = 0;
        let totalDueToday = 0;
        let totalPortfolio = 0;
        let debtsInArrearsCount = 0;

        for (const d of debts) {
            const remainingBase = Math.max(0, d.amount - (d.amountPaid || 0));
            totalBase += remainingBase;

            const cap = capacities[d.id];
            if (cap) {
                const arrears = cap.dueTodayArrears || 0;
                const deferment = cap.dueTodayDeferment || 0;
                const dueToday = cap.dueTodayTotal || 0;

                totalArrears += arrears;
                totalDeferment += deferment;
                totalDueToday += dueToday;
                totalPortfolio += remainingBase + arrears + deferment;

                if (arrears > 0 || cap.overdueInstallmentsCount > 0) {
                    debtsInArrearsCount++;
                }
            } else {
                totalPortfolio += remainingBase;
            }
        }

        return {
            totalBase,
            totalArrears,
            totalDeferment,
            totalDueToday,
            totalPortfolio,
            debtsInArrearsCount,
        };
    }, [debts, capacities]);

    const handleDebtClick = (debt: Debt) => {
        if (debt.clientDocument) {
            navigate(ScreenPaths.accountant.debitsCustomer(debt.clientDocument));
        }
    };

    if (!companyId) return null;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <AccountBalanceIcon color="primary" fontSize="large" />
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            Créditos Desembolsados
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Supervisión contable y auditoría de cartera activa con cálculo dinámico de moras y aplazamientos a hoy
                        </Typography>
                    </Box>
                </Box>
                {totals.debtsInArrearsCount > 0 && (
                    <Chip
                        icon={<WarningAmberIcon />}
                        label={`${totals.debtsInArrearsCount} créditos en mora`}
                        color="error"
                        variant="filled"
                        sx={{ fontWeight: "bold" }}
                    />
                )}
            </Box>

            {/* Metrics Snapshot */}
            {debts.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Saldo Base */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%", bgcolor: "background.paper" }}>
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                    <AttachMoneyIcon color="primary" fontSize="small" />
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Saldo Base Pendiente
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" color="text.primary">
                                    {FormatNumberToMoney(totals.totalBase)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Capital + interés pactado
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Mora a hoy */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                height: "100%",
                                bgcolor: "background.paper",
                                borderColor: totals.totalArrears > 0 ? "error.light" : "divider",
                            }}
                        >
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                    <WarningAmberIcon color={totals.totalArrears > 0 ? "error" : "action"} fontSize="small" />
                                    <Typography variant="caption" color="error.main" fontWeight={600}>
                                        Mora Acumulada a Hoy
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" color="error.main">
                                    {FormatNumberToMoney(totals.totalArrears)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Intereses moratorios causados
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Aplazamiento */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                height: "100%",
                                bgcolor: "background.paper",
                                borderColor: totals.totalDeferment > 0 ? "warning.light" : "divider",
                            }}
                        >
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                    <ScheduleIcon color={totals.totalDeferment > 0 ? "warning" : "action"} fontSize="small" />
                                    <Typography variant="caption" color="warning.dark" fontWeight={600}>
                                        Aplazamientos a Hoy
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" color="warning.dark">
                                    {FormatNumberToMoney(totals.totalDeferment)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Cargos diferidos pendientes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Exigible Hoy */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%", bgcolor: "background.paper" }}>
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                    <TrendingUpIcon color="secondary" fontSize="small" />
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Exigible Hoy
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" color={totals.totalDueToday > 0 ? "error.dark" : "text.primary"}>
                                    {FormatNumberToMoney(totals.totalDueToday)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Para quedar al día hoy
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Total Cartera */}
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%", bgcolor: "background.paper", borderColor: "primary.light" }}>
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                    <AccountBalanceIcon color="primary" fontSize="small" />
                                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                                        Total Cartera a Hoy
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight="bold" color="primary.main">
                                    {FormatNumberToMoney(totals.totalPortfolio)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Saldo base + moras + aplaz.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {loadingCapacities && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            {/* Debts Table */}
            <Box
                sx={{
                    backgroundColor: "background.paper",
                    borderRadius: CustomSx.basic.borderRadius.circularBorder,
                    p: 3,
                    boxShadow: 2,
                }}
            >
                {debts.length === 0 && !loading ? (
                    <Alert severity="info">No hay créditos registrados como entregados en el sistema</Alert>
                ) : (
                    <DebtListAccountant
                        debts={debts}
                        loadMore={loadMore}
                        hasMore={hasMore}
                        loading={loading}
                        onClick={handleDebtClick}
                        capacities={capacities}
                        loadingCapacities={loadingCapacities}
                    />
                )}
            </Box>
        </Container>
    );
}


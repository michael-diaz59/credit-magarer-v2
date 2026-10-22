import { useEffect, useState, useMemo } from "react";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    Chip,
    CircularProgress,
    List,
    ListItemButton,
    ListItemText,
    Tabs,
    Tab,
    Card,
    LinearProgress,
    Divider,
    Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RouteIcon from "@mui/icons-material/Route";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/redux/coreRedux";
import { DailyOperationsOrchestrator } from "../../../features/debits/domain/infraestructure/DailyOperationsOrchestrator";
import type {
    CollectorDailyOperations,
    RouteManagementGlobalStats,
    RouteManagementSummary,
    RouteCreditToManage,
} from "../../../features/debits/domain/business/useCases/audit/GetDailyOperationsUseCase";
import type { Route } from "../../../features/routes/domain/business/entities/Route";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { getLocalDate } from "../../../core/helpers/dates/calculateDays";
import FormatNumberToMoney from "../../sub_atomic_particles/FormatNumberToMoney";

export const DailyOperationsScreen = () => {
    const navigate = useNavigate();
    const companyId = useAppSelector((state) => state.user.user?.companyId) ?? "";

    const [currentTab, setCurrentTab] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [operations, setOperations] = useState<Record<string, CollectorDailyOperations>>({});
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [routeManagement, setRouteManagement] = useState<{
        globalStats: RouteManagementGlobalStats;
        routesSummary: Record<string, RouteManagementSummary>;
    }>({
        globalStats: {
            totalCredits: 0,
            managedCredits: 0,
            pendingCredits: 0,
            percentageManaged: 0,
            totalAmountExpected: 0,
            totalAmountCollected: 0,
        },
        routesSummary: {},
    });

    const dailyOperationsOrchestrator = useMemo(() => new DailyOperationsOrchestrator(), []);

    useEffect(() => {
        if (!companyId) return;

        let isMounted = true;
        const fetchOperations = async () => {
            try {
                setLoading(true);
                const today = getLocalDate(new Date());

                const res = await dailyOperationsOrchestrator.getDailyOperations({
                    companyId,
                    date: today,
                });

                if (isMounted && res.ok) {
                    setOperations(res.value.operations);
                    setRoutes(res.value.routes);
                    setRouteManagement(res.value.routeManagement);
                }
            } catch (error) {
                console.error("Error fetching daily operations", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchOperations();

        return () => {
            isMounted = false;
        };
    }, [companyId, dailyOperationsOrchestrator]);

    // Estadísticas activas para la barra superior (global o de la ruta seleccionada)
    const activeStats = useMemo<RouteManagementGlobalStats>(() => {
        if (!selectedRouteId || !routeManagement.routesSummary[selectedRouteId]) {
            return routeManagement.globalStats;
        }
        const r = routeManagement.routesSummary[selectedRouteId];
        return {
            totalCredits: r.totalCredits,
            managedCredits: r.managedCredits,
            pendingCredits: r.pendingCredits,
            percentageManaged: r.percentageManaged,
            totalAmountExpected: r.totalAmountExpected,
            totalAmountCollected: r.totalAmountCollected,
        };
    }, [selectedRouteId, routeManagement]);

    const displayRoutes = useMemo(() => {
        if (!selectedRouteId) return routes;
        return routes.filter((r) => r.id === selectedRouteId);
    }, [routes, selectedRouteId]);

    const filteredOperations = useMemo(() => {
        if (!selectedRouteId) return operations;
        return Object.fromEntries(
            Object.entries(operations).filter(([_, data]) =>
                data.routeIds?.includes(selectedRouteId)
            )
        );
    }, [operations, selectedRouteId]);

    const routeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        routes.forEach((r) => (counts[r.id] = 0));

        Object.values(operations).forEach((data) => {
            const total =
                data.payments.length +
                data.attempts.length +
                data.unmanagedInstallments.length;

            data.routeIds?.forEach((routeId) => {
                if (counts[routeId] !== undefined) {
                    counts[routeId] += total;
                }
            });
        });

        return counts;
    }, [operations, routes]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3} maxWidth={1400} margin="0 auto">
            {/* ENCABEZADO PRINCIPAL */}
            <Box mb={3}>
                <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px">
                    Operaciones y Cartera del Día
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Monitoreo en tiempo real de cobertura, créditos a gestionar e ingresos por ruta.
                </Typography>
            </Box>

            {/* PESTAÑAS DE NAVEGACIÓN */}
            <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(_, val) => setCurrentTab(val)}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab
                        icon={<RouteIcon fontSize="small" />}
                        iconPosition="start"
                        label="Créditos a Gestionar Hoy (Por Ruta)"
                        sx={{ fontWeight: 600, textTransform: "none", fontSize: "0.95rem" }}
                    />
                    <Tab
                        icon={<PeopleAltOutlinedIcon fontSize="small" />}
                        iconPosition="start"
                        label="Operación por Cobrador"
                        sx={{ fontWeight: 600, textTransform: "none", fontSize: "0.95rem" }}
                    />
                </Tabs>
            </Paper>

            {/* ========================================================= */}
            {/* TAB 0: CRÉDITOS A GESTIONAR HOY POR RUTA                  */}
            {/* ========================================================= */}
            {currentTab === 0 && (
                <Box>
                    {/* BARRA SUPERIOR Y NÚMERO PORCENTUAL DE CONTROL */}
                    <Card
                        elevation={2}
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            background: "linear-gradient(135deg, #ffffff 0%, #f9fbfd 100%)",
                        }}
                    >
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={2}>
                            <Box>
                                <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1}>
                                    {selectedRouteId && routeManagement.routesSummary[selectedRouteId]
                                        ? `Progreso de ${routeManagement.routesSummary[selectedRouteId].routeName}`
                                        : "Progreso Global de Cartera del Día"}
                                </Typography>
                                <Typography variant="h5" fontWeight={700}>
                                    {activeStats.managedCredits} de {activeStats.totalCredits} Créditos Gestionados
                                </Typography>
                            </Box>
                            <Box textAlign={{ xs: "left", sm: "right" }} mt={{ xs: 1, sm: 0 }}>
                                <Stack direction="row" spacing={1} alignItems="baseline" justifyContent={{ sm: "flex-end" }}>
                                    <Typography
                                        variant="h3"
                                        fontWeight={900}
                                        color={activeStats.percentageManaged === 100 ? "success.main" : "primary.main"}
                                    >
                                        {activeStats.percentageManaged}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                        completado
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>

                        {/* BARRA DE PROGRESO */}
                        <Box sx={{ width: "100%", mb: 3 }}>
                            <LinearProgress
                                variant="determinate"
                                value={activeStats.percentageManaged}
                                sx={{
                                    height: 14,
                                    borderRadius: 7,
                                    bgcolor: "rgba(0,0,0,0.06)",
                                    "& .MuiLinearProgress-bar": {
                                        borderRadius: 7,
                                        background:
                                            activeStats.percentageManaged === 100
                                                ? "linear-gradient(90deg, #2e7d32 0%, #4caf50 100%)"
                                                : "linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)",
                                    },
                                }}
                            />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* MÉTRICAS CLAVE */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
                            <Box flex={1} p={1.5} bgcolor="grey.50" borderRadius={2}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <TrendingUpIcon fontSize="small" color="primary" />
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Total Programado Hoy
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700}>
                                    {activeStats.totalCredits} créditos
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Exigible: ${FormatNumberToMoney(activeStats.totalAmountExpected)}
                                </Typography>
                            </Box>

                            <Box flex={1} p={1.5} bgcolor="success.50" borderRadius={2} border="1px solid" borderColor="success.200">
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                                    <Typography variant="caption" color="success.main" fontWeight={600}>
                                        Gestionados Hoy
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} color="success.dark">
                                    {activeStats.managedCredits} créditos
                                </Typography>
                                <Typography variant="caption" color="success.dark">
                                    Recaudado: ${FormatNumberToMoney(activeStats.totalAmountCollected)}
                                </Typography>
                            </Box>

                            <Box flex={1} p={1.5} bgcolor="error.50" borderRadius={2} border="1px solid" borderColor="error.200">
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <ScheduleIcon fontSize="small" color="error" />
                                    <Typography variant="caption" color="error.main" fontWeight={600}>
                                        Por Gestionar
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} color="error.dark">
                                    {activeStats.pendingCredits} créditos
                                </Typography>
                                <Typography variant="caption" color="error.dark">
                                    Pendientes de visita en calle
                                </Typography>
                            </Box>
                        </Stack>
                    </Card>

                    {/* FILTROS POR RUTA (CHIPS) */}
                    <Box mb={3}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>
                            Filtrar por Ruta:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                                label={`Todas las rutas (${routeManagement.globalStats.percentageManaged}%)`}
                                clickable
                                color={!selectedRouteId ? "primary" : "default"}
                                onClick={() => setSelectedRouteId(null)}
                                sx={{ fontWeight: 600, mb: 1 }}
                            />
                            {routes.map((route) => {
                                const rSummary = routeManagement.routesSummary[route.id];
                                const pct = rSummary ? rSummary.percentageManaged : 0;
                                return (
                                    <Chip
                                        key={route.id}
                                        clickable
                                        label={`${route.name} (${pct}%)`}
                                        color={selectedRouteId === route.id ? "primary" : "default"}
                                        variant={selectedRouteId === route.id ? "filled" : "outlined"}
                                        onClick={() => setSelectedRouteId(route.id)}
                                        sx={{ fontWeight: 600, mb: 1 }}
                                    />
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* LISTA DE RUTAS Y CRÉDITOS */}
                    {displayRoutes.length === 0 ? (
                        <Typography color="text.secondary">No hay rutas registradas.</Typography>
                    ) : (
                        displayRoutes.map((route) => {
                            const rSummary = routeManagement.routesSummary[route.id];
                            const credits = rSummary?.credits ?? [];
                            const pct = rSummary?.percentageManaged ?? 0;

                            return (
                                <Accordion
                                    key={route.id}
                                    defaultExpanded={Boolean(selectedRouteId)}
                                    sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        "&:before": { display: "none" },
                                    }}
                                    elevation={1}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            alignItems={{ xs: "flex-start", md: "center" }}
                                            width="100%"
                                            pr={2}
                                        >
                                            <Typography fontWeight={700} variant="subtitle1" sx={{ minWidth: 200 }}>
                                                {route.name}
                                            </Typography>

                                            {/* MINI BARRA Y PORCENTAJE POR RUTA */}
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 240, width: { xs: "100%", md: "auto" } }}>
                                                <Box width={{ xs: "100%", sm: 120 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={pct}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: "rgba(0,0,0,0.06)",
                                                            "& .MuiLinearProgress-bar": {
                                                                borderRadius: 4,
                                                                background:
                                                                    pct === 100
                                                                        ? "linear-gradient(90deg, #2e7d32, #4caf50)"
                                                                        : "linear-gradient(90deg, #1976d2, #42a5f5)",
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" fontWeight={800} color={pct === 100 ? "success.main" : "primary.main"} sx={{ minWidth: 45 }}>
                                                    {pct}%
                                                </Typography>
                                            </Stack>

                                            {/* CHIPS DE GESTIÓN POR RUTA */}
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexGrow: 1, justifyContent: { md: "flex-end" } }}>
                                                <Chip
                                                    label={`${rSummary?.managedCredits ?? 0} Gestionados`}
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`${rSummary?.pendingCredits ?? 0} Por Gestionar`}
                                                    color={rSummary && rSummary.pendingCredits > 0 ? "error" : "default"}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`Total: $${FormatNumberToMoney(rSummary?.totalAmountExpected ?? 0)}`}
                                                    size="small"
                                                    sx={{ bgcolor: "grey.100", fontWeight: 600 }}
                                                />
                                            </Stack>
                                        </Stack>
                                    </AccordionSummary>

                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <Divider sx={{ mb: 1 }} />
                                        {credits.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" p={2}>
                                                No hay créditos exigibles programados para hoy en esta ruta.
                                            </Typography>
                                        ) : (
                                            <List disablePadding>
                                                {credits.map((credit) => (
                                                    <CreditManagementListItem
                                                        key={credit.debtId}
                                                        credit={credit}
                                                        onNavigatePayment={(id) => navigate(ScreenPaths.auditor.payment(id))}
                                                        onNavigateAttempt={(id) => navigate(ScreenPaths.auditor.collectionAttemptDetail(id))}
                                                        onNavigateInstallments={(debtId) => navigate(ScreenPaths.auditor.installments(debtId))}
                                                    />
                                                ))}
                                            </List>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })
                    )}
                </Box>
            )}

            {/* ========================================================= */}
            {/* TAB 1: OPERACIÓN POR COBRADOR                             */}
            {/* ========================================================= */}
            {currentTab === 1 && (
                <Box>
                    {/* CHIPS DE RUTAS */}
                    <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
                        <Chip
                            label="Todas las rutas"
                            clickable
                            color={!selectedRouteId ? "primary" : "default"}
                            onClick={() => setSelectedRouteId(null)}
                        />
                        {routes.map((route) => (
                            <Chip
                                key={route.id}
                                clickable
                                label={`${route.name} (${routeCounts[route.id] ?? 0})`}
                                color={selectedRouteId === route.id ? "primary" : "default"}
                                onClick={() => setSelectedRouteId(route.id)}
                            />
                        ))}
                    </Stack>

                    {Object.keys(filteredOperations).length === 0 ? (
                        <Typography color="text.secondary">No hay operaciones registradas para esta ruta.</Typography>
                    ) : (
                        Object.entries(filteredOperations).map(([colId, data]) => (
                            <Accordion
                                key={colId}
                                sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    "&:before": { display: "none" },
                                }}
                                elevation={1}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Stack direction="row" spacing={2} alignItems="center" width="100%" pr={1}>
                                        <Typography fontWeight={700} flexGrow={1}>
                                            {data.collectorName}
                                        </Typography>

                                        <Chip label={`${data.payments.length} Pagos`} color="success" size="small" variant="outlined" />
                                        <Chip label={`${data.attempts.length} Intentos`} color="warning" size="small" variant="outlined" />
                                        <Chip
                                            label={`${data.unmanagedInstallments.length} Sin Gestión`}
                                            color={data.unmanagedInstallments.length > 0 ? "error" : "default"}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                </AccordionSummary>

                                <AccordionDetails>
                                    <List disablePadding>
                                        {data.payments.map((p) => (
                                            <ListItemButton
                                                key={p.id}
                                                divider
                                                onClick={() => navigate(ScreenPaths.auditor.payment(p.id))}
                                            >
                                                <ListItemText
                                                    primary={`Pago: ${p.clientName}`}
                                                    secondary={`Monto: $${FormatNumberToMoney(p.amount)} | Hora: ${
                                                        p.paidAt.split("T")[1]?.slice(0, 5) || p.paidAt
                                                    }`}
                                                />
                                                <Chip label={p.status} size="small" color="success" />
                                            </ListItemButton>
                                        ))}

                                        {data.attempts.map((a) => (
                                            <ListItemButton
                                                key={a.id}
                                                divider
                                                onClick={() => navigate(ScreenPaths.auditor.collectionAttemptDetail(a.id))}
                                            >
                                                <ListItemText
                                                    primary={`Intento: ${a.name}`}
                                                    secondary={`Observación: ${a.colletorDescription || "Sin detalle"} | Hora: ${
                                                        a.date.split("T")[1]?.slice(0, 5) || a.date
                                                    }`}
                                                />
                                                <Chip label="Intento" size="small" color="warning" />
                                            </ListItemButton>
                                        ))}

                                        {data.unmanagedInstallments.map((inst) => (
                                            <ListItemButton
                                                key={inst.id}
                                                divider
                                                onClick={() => navigate(ScreenPaths.auditor.installments(inst.debtId))}
                                            >
                                                <ListItemText
                                                    primary={`Sin Gestión: ${inst.clientName}`}
                                                    secondary={`Vencimiento: ${inst.dueDate} | Monto: $${FormatNumberToMoney(inst.amount)}`}
                                                />
                                                <Chip label="Pendiente" size="small" color="error" />
                                            </ListItemButton>
                                        ))}

                                        {data.payments.length === 0 &&
                                            data.attempts.length === 0 &&
                                            data.unmanagedInstallments.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" p={2}>
                                                    Sin registros ni cuotas pendientes hoy.
                                                </Typography>
                                            )}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}
                </Box>
            )}
        </Box>
    );
};

interface CreditManagementListItemProps {
    credit: RouteCreditToManage;
    onNavigatePayment: (paymentId: string) => void;
    onNavigateAttempt: (attemptId: string) => void;
    onNavigateInstallments: (debtId: string) => void;
}

const CreditManagementListItem = ({
    credit,
    onNavigatePayment,
    onNavigateAttempt,
    onNavigateInstallments,
}: CreditManagementListItemProps) => {
    const handleClick = () => {
        if (credit.managementStatus === "pagado" && credit.paymentDetail?.paymentId) {
            onNavigatePayment(credit.paymentDetail.paymentId);
        } else if (credit.managementStatus === "intento" && credit.attemptDetail?.attemptId) {
            onNavigateAttempt(credit.attemptDetail.attemptId);
        } else {
            onNavigateInstallments(credit.debtId);
        }
    };

    return (
        <ListItemButton divider onClick={handleClick} sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center" width="100%">
                <Box>
                    {credit.managementStatus === "pagado" && <CheckCircleOutlineIcon color="success" />}
                    {credit.managementStatus === "intento" && <WarningAmberIcon color="warning" />}
                    {credit.managementStatus === "pendiente" && <ScheduleIcon color="error" />}
                </Box>

                <Box flexGrow={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                        {credit.customerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {credit.debtName} • {credit.installmentSummary || `Cuota #${credit.installmentNumber}`} • Vence: {credit.dueDate}
                    </Typography>
                </Box>

                <Box textAlign="right">
                    <Typography variant="subtitle2" fontWeight={700}>
                        ${FormatNumberToMoney(credit.totalDueToday)}
                    </Typography>
                    {credit.dynamicArrears > 0 && (
                        <Typography variant="caption" color="error.main" fontWeight={600} display="block">
                            Mora: ${FormatNumberToMoney(credit.dynamicArrears)}
                        </Typography>
                    )}
                </Box>

                <Box>
                    {credit.managementStatus === "pagado" && (
                        <Chip
                            label={
                                credit.paymentsCount > 1
                                    ? `Pagado: $${FormatNumberToMoney(credit.totalPaidToday)} (${credit.paymentsCount} pagos)`
                                    : `Pagado: $${FormatNumberToMoney(credit.totalPaidToday || credit.paymentDetail?.amount || 0)}`
                            }
                            size="small"
                            color="success"
                            variant="filled"
                        />
                    )}
                    {credit.managementStatus === "intento" && (
                        <Chip
                            label={`Intento: ${credit.attemptDetail?.description || "No pagó"}`}
                            size="small"
                            color="warning"
                            variant="filled"
                        />
                    )}
                    {credit.managementStatus === "pendiente" && (
                        <Chip label="Por Gestionar" size="small" color="error" variant="outlined" />
                    )}
                </Box>
            </Stack>
        </ListItemButton>
    );
};
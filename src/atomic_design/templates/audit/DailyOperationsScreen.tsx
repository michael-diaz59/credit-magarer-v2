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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";

import { useAppSelector } from "../../../store/redux/coreRedux";
import PaymentOrchestrator from "../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import { CollectionAttemptOrchestrator } from "../../../features/debits/domain/infraestructure/CollectionAttemptOrchestrator";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";

import type { Payment } from "../../../features/debits/domain/business/entities/Payment";
import type { CollectionAttempt } from "../../../features/debits/domain/business/entities/CollectionAttempt";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import type { Route } from "../../../features/routes/domain/business/entities/Route";

import { ScreenPaths } from "../../../core/helpers/name_routes";
import { RouteOrchestrator } from "../../../features/routes/domain/infraestructure/RouteOrchestrator";

interface GroupedOperations {
    [collectorId: string]: {
        collectorName: string;
        routeIds?: string[];
        payments: Payment[];
        attempts: CollectionAttempt[];
        unmanagedInstallments: Installment[];
    };
}

export const DailyOperationsScreen = () => {

    const navigate = useNavigate();
    const companyId = useAppSelector((state) => state.user.user?.companyId) ?? "";

    const [loading, setLoading] = useState(true);
    const [operations, setOperations] = useState<GroupedOperations>({});

    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

    useEffect(() => {

        if (!companyId) return;

        const fetchOperations = async () => {

            try {

                setLoading(true);

                const today = new Date().toISOString().split("T")[0];

                const paymentOrch = new PaymentOrchestrator();
                const attemptOrch = new CollectionAttemptOrchestrator();
                const instOrch = new InstallmentsOrchestrator();
                const routeOrch = new RouteOrchestrator();

                const userOrch = new UserOrchestrator({} as any);

                const usersRes = await userOrch.getUsersByCompany({
                    id: companyId,
                    rol: "COLLECTOR" as any
                });

                const routesRes = await routeOrch.getRoutesUseCase.execute({ companyId });

                if (routesRes.ok) {
                    setRoutes(routesRes.value);
                }

                const grouped: GroupedOperations = {};

                if (usersRes.state.ok) {

                    const collectors = usersRes.state.value;

                    collectors.forEach(c => {

                        grouped[c.id] = {
                            collectorName: c.name,
                            routeIds: c.idRoutes ?? [],
                            payments: [],
                            attempts: [],
                            unmanagedInstallments: []
                        };

                    });
                }

                const [paymentsRes, attemptsRes] = await Promise.all([
                    paymentOrch.getByDate(companyId, today),
                    attemptOrch.getAttemptsByDate(companyId, today)
                ]);

                if (paymentsRes.ok) {

                    paymentsRes.value.forEach(p => {

                        const colId = p.collectorId;

                        if (grouped[colId]) {

                            grouped[colId].payments.push(p);

                        } else {

                            grouped[colId] = {
                                collectorName: p.collectorName || "Desconocido",
                                routeIds: [],
                                payments: [p],
                                attempts: [],
                                unmanagedInstallments: []
                            };

                        }

                    });
                }

                if (attemptsRes.ok) {

                    attemptsRes.value.forEach(a => {

                        const colId = a.collectorId;

                        if (grouped[colId]) {

                            grouped[colId].attempts.push(a);

                        } else {

                            grouped[colId] = {
                                collectorName: "Desconocido",
                                routeIds: [],
                                payments: [],
                                attempts: [a],
                                unmanagedInstallments: []
                            };

                        }

                    });

                }

                const collectorProcessPromises = Object.keys(grouped).map(async (colId) => {

                    const nextInstRes = await instOrch.getNextByCollector({
                        companyId,
                        collectorId: colId
                    });

                    if (nextInstRes.ok && nextInstRes.value.state.length > 0) {

                        const pendingToday = nextInstRes.value.state;

                        const unmanaged = pendingToday.filter(inst => {

                            const hasPaymentToday =
                                grouped[colId].payments.some(p => p.installmentId === inst.id);

                            const hasAttemptToday =
                                grouped[colId].attempts.some(a => a.installmentId === inst.id);

                            return !hasPaymentToday && !hasAttemptToday && inst.status !== "pagada";

                        });

                        grouped[colId].unmanagedInstallments = unmanaged;

                    }

                });

                await Promise.all(collectorProcessPromises);

                setOperations(grouped);

            } catch (error) {

                console.error("Error fetching daily operations", error);

            } finally {

                setLoading(false);

            }

        };

        fetchOperations();

    }, [companyId]);



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

        routes.forEach(r => counts[r.id] = 0);

        Object.values(operations).forEach(data => {

            const total =
                data.payments.length +
                data.attempts.length +
                data.unmanagedInstallments.length;

            data.routeIds?.forEach(routeId => {

                if (counts[routeId] !== undefined) {
                    counts[routeId] += total;
                }

            });

        });

        return counts;

    }, [operations, routes]);



    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );



    return (

        <Box p={3}>

            <Typography variant="h4" fontWeight={700} mb={3}>
                Operaciones del Día
            </Typography>



            {/* CHIPS DE RUTAS */}

            <Stack direction="row" spacing={1} mb={4} flexWrap="wrap">

                <Chip
                    label="Todas"
                    clickable
                    color={!selectedRouteId ? "primary" : "default"}
                    onClick={() => setSelectedRouteId(null)}
                />

                {routes.map(route => (

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

                <Typography color="text.secondary">
                    No hay operaciones para esta ruta.
                </Typography>

            ) : (

                Object.entries(filteredOperations).map(([colId, data]) => (

                    <Accordion
                        key={colId}
                        sx={{
                            mb: 2,
                            borderRadius: 2,
                            "&:before": { display: "none" }
                        }}
                        elevation={2}
                    >

                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>

                            <Stack direction="row" spacing={2} alignItems="center" width="100%">

                                <Typography fontWeight={600} flexGrow={1}>
                                    {data.collectorName}
                                </Typography>

                                <Chip
                                    label={`${data.payments.length} Pagos`}
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                />

                                <Chip
                                    label={`${data.attempts.length} Intentos`}
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                />

                                <Chip
                                    label={`${data.unmanagedInstallments.length} Sin Gestión`}
                                    color="error"
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
                                        onClick={() =>
                                            navigate(ScreenPaths.auditor.payment(p.id))
                                        }
                                    >

                                        <ListItemText
                                            primary={`Pago: ${p.costumerName}`}
                                            secondary={`Monto: $${p.amount} | Hora: ${p.paidAt.split("T")[1]?.slice(0, 5) || p.paidAt}`}
                                        />

                                        <Chip label={p.status} size="small" color="success" />

                                    </ListItemButton>

                                ))}



                                {data.attempts.map((a) => (

                                    <ListItemButton
                                        key={a.id}
                                        divider
                                        onClick={() =>
                                            navigate(ScreenPaths.auditor.collectionAttemptDetail(a.id))
                                        }
                                    >

                                        <ListItemText
                                            primary={`Intento: ${a.name}`}
                                            secondary={`ID Cliente: ${a.customerId} | Hora: ${a.date.split("T")[1]?.slice(0, 5) || a.date}`}
                                        />

                                        <Chip label="Intento" size="small" color="warning" />

                                    </ListItemButton>

                                ))}



                                {data.unmanagedInstallments.map((inst) => (

                                    <ListItemButton
                                        key={inst.id}
                                        divider
                                        onClick={() =>
                                            navigate(ScreenPaths.auditor.installments(inst.debtId))
                                        }
                                    >

                                        <ListItemText
                                            primary={`Sin Gestión: ${inst.costumerName}`}
                                            secondary={`Vencimiento: ${inst.dueDate} | Monto: $${inst.amount}`}
                                        />

                                        <Chip label="Pendiente" size="small" color="error" />

                                    </ListItemButton>

                                ))}



                                {data.payments.length === 0 &&
                                    data.attempts.length === 0 &&
                                    data.unmanagedInstallments.length === 0 && (

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            p={2}
                                        >
                                            Sin registros ni cuotas pendientes hoy.
                                        </Typography>

                                    )}

                            </List>

                        </AccordionDetails>

                    </Accordion>

                ))

            )}

        </Box>

    );

};
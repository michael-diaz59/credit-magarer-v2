import { useEffect, useState } from "react";
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
import { ScreenPaths } from "../../../core/helpers/name_routes";

interface GroupedOperations {
    [collectorId: string]: {
        collectorName: string;
        payments: Payment[];
        attempts: CollectionAttempt[];
        unmanagedInstallments: Installment[];
    };
}

export const DailyOperationsScreen = () => {
    const navigate = useNavigate();
    const companyId = useAppSelector((state) => state.user.user?.companyId) ?? "";

    console.log("DailyOperationsScreen")
    // To simplify: we'll instantiate orchestrators inside the effect or useMemo

    const [loading, setLoading] = useState(true);
    const [operations, setOperations] = useState<GroupedOperations>({});

    useEffect(() => {
        if (!companyId) return;

        const fetchOperations = async () => {
            try {
                setLoading(true);
                const today = new Date().toISOString().split("T")[0];

                const paymentOrch = new PaymentOrchestrator();
                const attemptOrch = new CollectionAttemptOrchestrator();
                // We pass any as dispatch since we are only reading users, not setting them in Redux
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const userOrch = new UserOrchestrator({} as any);
                const instOrch = new InstallmentsOrchestrator();

                // 1. Fetch all collectors for the company
                const usersRes = await userOrch.getUsersByCompany({ id: companyId, rol: "COLLECTOR" as any });



                const grouped: GroupedOperations = {};

                if (usersRes.state.ok) {
                    console.log("usersRes", usersRes.state.value);
                    const collectors = usersRes.state.value;
                    collectors.forEach(c => {
                        grouped[c.id] = {
                            collectorName: c.name,
                            payments: [],
                            attempts: [],
                            unmanagedInstallments: []
                        };
                    });
                }

                console.log("grouped", grouped);

                // 2. Fetch payments, attempts concurrently
                const [paymentsRes, attemptsRes] = await Promise.all([
                    paymentOrch.getByDate(companyId, today),
                    attemptOrch.getAttemptsByDate(companyId, today)
                ]);

                console.log("paymentsRes", paymentsRes);
                console.log("attemptsRes", attemptsRes);

                if (paymentsRes.ok) {
                    paymentsRes.value.forEach(p => {
                        const colId = p.collectorId;
                        if (grouped[colId]) {
                            grouped[colId].payments.push(p);
                        } else {
                            // En caso de que haya un pago de un cobrador eliminado o sin rol actual
                            grouped[colId] = { collectorName: p.collectorName || "Desconocido", payments: [p], attempts: [], unmanagedInstallments: [] };
                        }
                    });
                }

                if (attemptsRes.ok) {
                    attemptsRes.value.forEach((a) => {
                        const colId = a.collectorId;
                        if (grouped[colId]) {
                            grouped[colId].attempts.push(a);
                        } else {
                            // Intentos huérfanos
                            grouped[colId] = { collectorName: "Desconocido", payments: [], attempts: [a], unmanagedInstallments: [] };
                        }
                    });
                }

                // 3. For each collector in grouped, figure out unmanaged installments
                // We iterate over the Object.keys to ensure we get pending installments for everyone
                console.log("grouped", grouped);
                const collectorProcessPromises = Object.keys(grouped).map(async (colId) => {
                    const nextInstRes = await instOrch.getNextByCollector({ companyId, collectorId: colId });

                    if (nextInstRes.ok && nextInstRes.value.state.length > 0) {
                        const pendingToday = nextInstRes.value.state;

                        // LOG agregado para depuración de todos los installments pendientes obtenidos
                        console.log(`Cuotas pendientes obtenidas hoy para el cobrador ${grouped[colId].collectorName} (ID: ${colId}):`, pendingToday);

                        // Filters out installments that already have a payment or an attempt TODAY
                        const unmanaged = pendingToday.filter(inst => {
                            // Check if there's a payment TODAY for this installment
                            const hasPaymentToday = grouped[colId].payments.some(p => p.installmentId === inst.id);
                            // Check if there's an attempt TODAY for this installment
                            const hasAttemptToday = grouped[colId].attempts.some(a => a.installmentId === inst.id);

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

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress />
        </Box>
    );

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight={700} mb={4}>
                Operaciones del Día
            </Typography>

            {Object.keys(operations).length === 0 ? (
                <Typography color="text.secondary">No hay operaciones registradas hoy.</Typography>
            ) : (
                Object.entries(operations).map(([colId, data]) => (
                    <Accordion key={colId} sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }} elevation={2}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" spacing={2} alignItems="center" width="100%">
                                <Typography fontWeight={600} flexGrow={1}>{data.collectorName}</Typography>
                                <Chip label={`${data.payments.length} Pagos`} color="success" size="small" variant="outlined" />
                                <Chip label={`${data.attempts.length} Intentos`} color="warning" size="small" variant="outlined" />
                                <Chip label={`${data.unmanagedInstallments.length} Sin Gestión`} color="error" size="small" variant="outlined" />
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
                                            primary={`Pago: ${p.costumerName}`}
                                            secondary={`Monto: $${p.amount} | Hora: ${p.paidAt.split('T')[1]?.slice(0, 5) || p.paidAt}`}
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
                                            secondary={`ID Cliente: ${a.customerId} | Hora: ${a.date.split('T')[1]?.slice(0, 5) || a.date}`}
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
                                            primary={`Sin Gestión: ${inst.costumerName}`}
                                            secondary={`Vencimiento: ${inst.dueDate} | Monto: $${inst.amount}`}
                                        />
                                        <Chip label="Pendiente" size="small" color="error" />
                                    </ListItemButton>
                                ))}
                                {data.payments.length === 0 && data.attempts.length === 0 && data.unmanagedInstallments.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" p={2}>Sin registros ni cuotas pendientes hoy.</Typography>
                                )}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
};

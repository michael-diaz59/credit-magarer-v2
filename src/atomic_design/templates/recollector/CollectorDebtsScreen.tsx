import { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";

export const CollectorDebtsScreen = () => {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.user.user);
    const companyId = user?.companyId ?? "";
    const collectorId = user?.id ?? "";

    const [loading, setLoading] = useState(true);
    const [debts, setDebts] = useState<Debt[]>([]);

    useEffect(() => {
        if (!companyId || !collectorId) return;

        const fetchDebts = async () => {
            try {
                setLoading(true);
                const orchestrator = new DebtOrchestrator();
                const result = await orchestrator.getDebtsValidByCollector({
                    companyId,
                    collectorId,
                });

                if (result.ok) {
                    setDebts(result.value.state);
                }
            } catch (error) {
                console.error("Error fetching debts for collector", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDebts();
    }, [companyId, collectorId]);

    // Agrupar deudas por cliente
    const groupedDebts = useMemo(() => {
        const groups: { [key: string]: { customerName: string; debts: Debt[] } } = {};
        debts.forEach((debt) => {
            const key = debt.clientId || "unknown";
            if (!groups[key]) {
                groups[key] = {
                    customerName: debt.costumerName || "Cliente Desconocido",
                    debts: [],
                };
            }
            groups[key].debts.push(debt);
        });
        return Object.values(groups);
    }, [debts]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3} fontWeight="bold">
                Mis Clientes y Deudas
            </Typography>

            {groupedDebts.length === 0 ? (
                <Typography color="text.secondary" align="center" mt={4}>
                    No tienes deudas activas o en mora asignadas.
                </Typography>
            ) : (
                groupedDebts.map((group) => (
                    <Accordion key={group.customerName} sx={{ mb: 1, borderRadius: '8px', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {group.customerName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {group.debts.length} {group.debts.length === 1 ? "deuda activa" : "deudas activas"}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <Divider />
                            <List disablePadding>
                                {group.debts.map((debt) => (
                                    <ListItem disablePadding key={debt.id}>
                                        <ListItemButton
                                            onClick={() => navigate(ScreenPaths.collector.debtInstallments(debt.id))}
                                            sx={{
                                                py: 2,
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            <ListItemText
                                                primary={`Deuda: ${debt.name}`}
                                                secondary={
                                                    <Box component="span" display="flex" flexDirection="column">
                                                        <Typography variant="body2" component="span">
                                                            Monto Total: ${debt.totalAmount.toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="body2" component="span" color={debt.status === 'en_mora' ? 'error.main' : 'primary.main'}>
                                                            Estado: {debt.status === 'activa' ? 'Activa' : 'En Mora'}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
};

import { useEffect, useState } from "react";
import { Box, Chip, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";

export const CollectorDebtInstallmentsScreen = () => {
    const { debtId } = useParams<{ debtId: string }>();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.user.user);
    const companyId = user?.companyId ?? "";

    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState<Installment[]>([]);

    useEffect(() => {
        if (!debtId || !companyId) {
            setLoading(false);
            return;
        }

        const fetchInstallments = async () => {
            try {
                setLoading(true);
                const orchestrator = new InstallmentsOrchestrator();

                const result = await orchestrator.getByDebt({
                    debtId,
                    companyId,
                });

                if (result.state.ok) {
                    setInstallments(result.state.value);
                }
            } catch (error) {
                console.error("Error cargando cuotas de la deuda", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstallments();
    }, [debtId, companyId]);

    const getStatusColor = (status: string) => {
        if (status === "pendiente") return "error";
        if (status === "incompleto") return "warning";
        return "success";
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
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">Cuotas de la Deuda</Typography>
            </Stack>

            {sortedInstallments.length > 0 && (
                <Box mb={2} px={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {sortedInstallments[0].costumerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        CC: {sortedInstallments[0].costumerDocument}
                    </Typography>
                </Box>
            )}

            <Stack spacing={2}>
                {sortedInstallments.map((i) => (
                    <Box
                        key={i.id}
                        p={2}
                        border="1px solid"
                        borderColor="divider"
                        borderRadius={2}
                        sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "action.hover" },
                            backgroundColor: 'background.paper'
                        }}
                        onClick={() => navigate(ScreenPaths.collector.installment(i.id))}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography fontWeight="500">
                                Cuota #{i.installmentNumber}
                            </Typography>
                            <Chip
                                label={i.status}
                                color={getStatusColor(i.status)}
                                size="small"
                                variant="outlined"
                            />
                        </Stack>

                        <Typography variant="h6" color="primary.main">
                            ${i.amount.toLocaleString()}
                        </Typography>

                        <Stack direction="row" justifyContent="space-between" mt={1}>
                            <Typography variant="body2" color="text.secondary">
                                Vence: {new Date(i.dueDate).toLocaleDateString()}
                            </Typography>
                            {i.paidAmount > 0 && (
                                <Typography variant="body2" color="success.main">
                                    Pagado: ${i.paidAmount.toLocaleString()}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                ))}

                {sortedInstallments.length === 0 && (
                    <Typography color="text.secondary" align="center" mt={4}>
                        No se encontraron cuotas para esta deuda.
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};

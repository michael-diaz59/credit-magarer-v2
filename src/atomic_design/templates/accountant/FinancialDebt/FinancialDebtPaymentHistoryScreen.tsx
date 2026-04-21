
import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, Card, CardContent, CircularProgress, IconButton } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FinancialPaymentOrchestrator from "../../../../features/financialDebt/domain/infraestructure/FinancialPaymentOrchestrator";
import { type FinancialPayment } from "../../../../features/financialDebt/domain/business/entities/FinancialPayment";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

export const FinancialDebtPaymentHistoryScreen: React.FC = () => {
    const { debtId } = useParams<{ debtId: string }>();
    const navigate = useNavigate();
    const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");
    const [payments, setPayments] = useState<FinancialPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!debtId || !companyId) return;

        const fetchPayments = async () => {
            setLoading(true);
            const orchestrator = new FinancialPaymentOrchestrator();
            const result = await orchestrator.getPaymentsByDebtId({ companyId, financialDebtId: debtId });

            if (result.ok) {
                setPayments(result.value);
            }
            setLoading(false);
        };

        fetchPayments();
    }, [debtId, companyId]);

    const handleItemClick = (paymentId: string) => {
        navigate(ScreenPaths.accountant.financialPaymentDetail(paymentId));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3} maxWidth={800} mx="auto">
            <Stack direction="row" alignItems="center" spacing={1} mb={4}>
                <IconButton onClick={() => navigate(-1)} color="primary">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Historial de Pagos
                </Typography>
            </Stack>

            {payments.length === 0 ? (
                <Box textAlign="center" py={10}>
                    <ReceiptLongIcon sx={{ fontSize: 80, color: "action.disabled", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        No se han registrado pagos para este financiamiento.
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {payments.map((payment) => (
                        <Card
                            key={payment.id}
                            elevation={2}
                            sx={{
                                borderRadius: 3,
                                cursor: "pointer",
                                "&:hover": { bgcolor: "action.hover" },
                                borderLeft: payment.amount > 0 ? "6px solid #4caf50" : "6px solid #f44336"
                            }}
                            onClick={() => handleItemClick(payment.id)}
                        >
                            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            $ {FormatNumberToMoney(payment.amount)}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {new Date(payment.createAt).toLocaleDateString()} - {payment.method}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="body2" color="textPrimary">
                                            {payment.collectorName}
                                        </Typography>
                                        {payment.idProofOfPayment && (
                                            <Typography variant="caption" color="primary" fontWeight="bold">
                                                Con comprobante
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            <Box mt={4} textAlign="center">
                <Typography variant="caption" color="textSecondary">
                    * Mostrando todos los abonos y pagos registrados históricamente para este financiamiento.
                </Typography>
            </Box>
        </Box>
    );
};

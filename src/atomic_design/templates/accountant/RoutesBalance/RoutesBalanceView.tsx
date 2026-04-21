import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Divider,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PieChart } from "@mui/x-charts/PieChart";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import type { Route } from "../../../../features/routes/domain/business/entities/Route";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";
import type { User } from "../../../../features/users/domain/business/entities/User";

interface RoutesBalanceViewProps {
    routes: Route[];
    bankAccounts: BankAccount[];
    collectors: User[];
    isLoading: boolean;
    globalTotal: number;
    globalChartData: any[];
    totalCashSystem: number;
    bankAccountTotals: Record<string, number>;
}

export const RoutesBalanceView = ({
    routes,
    bankAccounts,
    collectors,
    isLoading,
    globalTotal,
    globalChartData,
    totalCashSystem,
    bankAccountTotals,
}: RoutesBalanceViewProps) => {
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={4} sx={{ maxWidth: 1200, margin: "0 auto" }}>
            <Typography variant="h4" fontWeight="bold" mb={4} color="primary">
                Resumen de Balances por Ruta
            </Typography>

            {/* Global Total Card */}
            <Card sx={{ mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>Balance Total del Sistema</Typography>
                    <Typography variant="h2" fontWeight="bold">
                        {FormatNumberToMoney(globalTotal)}
                    </Typography>
                </CardContent>
            </Card>

            {/* Consolidated Summary Section */}
            <Typography variant="h5" fontWeight="bold" mt={4} mb={2}>
                Resumen Consolidado del Sistema (Efectivo y Bancos)
            </Typography>
            <Grid container spacing={2} mb={4}>
                {/* Total Cash in System */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card sx={{ borderRadius: 3, borderLeft: '6px solid', borderLeftColor: 'success.main', height: '100%', display: 'flex', alignItems: 'center' }}>
                        <CardContent sx={{ width: '100%' }}>
                            <Typography variant="overline" color="text.secondary" fontWeight="bold">EFECTIVO TOTAL EN RUTAS</Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {FormatNumberToMoney(totalCashSystem)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Bank Totals */}
                {Object.entries(bankAccountTotals).map(([bankId, amount]) => {
                    const bank = bankAccounts.find(b => b.id === bankId);
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bankId}>
                            <Card sx={{ borderRadius: 3, borderLeft: '6px solid', borderLeftColor: 'primary.main', height: '100%', display: 'flex', alignItems: 'center' }}>
                                <CardContent sx={{ width: '100%' }}>
                                    <Typography variant="overline" color="text.secondary" fontWeight="bold">
                                        {bank ? `${bank.bankName} - ${bank.name}` : `CUENTA ID: ${bankId}`}
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                                        {FormatNumberToMoney(amount)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Global Distribution Chart */}
            <Card sx={{ mb: 6, borderRadius: 3, overflow: 'hidden' }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                        Distribución de Fondos por Ruta (%)
                    </Typography>
                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box height={300} display="flex" justifyContent="center">
                                <PieChart
                                    series={[
                                        {
                                            data: globalChartData,
                                            innerRadius: 40,
                                            outerRadius: 100,
                                            paddingAngle: 5,
                                            cornerRadius: 8,
                                            highlightScope: { fade: 'global', highlight: 'item' },
                                            faded: { innerRadius: 40, additionalRadius: -10, color: 'gray' },
                                        },
                                    ]}
                                    height={300}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="body1" color="text.secondary" mb={2}>
                                    La siguiente lista muestra el aporte porcentual de cada ruta al capital total del sistema:
                                </Typography>
                                <Stack spacing={1.5}>
                                    {globalChartData.map((item, index) => (
                                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.8 }} />
                                                <Typography variant="body2" fontWeight="medium">{item.label}</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                                {((item.value / globalTotal) * 100).toFixed(1)}% ({FormatNumberToMoney(item.value)})
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Route Breakdowns Accordions */}
            <Typography variant="h5" fontWeight="bold" mt={6} mb={3}>
                Desglose Detallado por Ruta
            </Typography>

            <Stack spacing={2}>
                {routes.map((route) => {
                    const cashTotal = (route.totalCash2 || []).reduce((acc, c) => acc + c.amount, 0);
                    const depositTotal = (route.totalDeposit || []).reduce((acc, d) => acc + d.amount, 0);
                    const routeTotal = cashTotal + depositTotal;

                    if (routeTotal === 0) return null;

                    const typeChartData = [
                        { id: 0, value: cashTotal, label: "Efectivo", color: "#4caf50" },
                        { id: 1, value: depositTotal, label: "Depósitos", color: "#2196f3" }
                    ].filter(i => i.value > 0);

                    const collectorChartData = (route.totalCash2 || []).map((c, idx) => {
                        const collector = collectors.find(u => u.id === c.collectorId);
                        return {
                            id: idx,
                            value: c.amount,
                            label: collector ? `${collector.name}` : `ID: ${c.collectorId.substring(0, 5)}...`
                        };
                    }).filter(i => i.value > 0);

                    return (
                        <Accordion key={route.id} sx={{ borderRadius: '16px !important', overflow: 'hidden', '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ bgcolor: 'background.paper', px: 3, py: 1 }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                        {route.name || "Sin nombre (default)"}
                                    </Typography>
                                    <Box textAlign="right">
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>TOTAL RUTA</Typography>
                                        <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                            {FormatNumberToMoney(routeTotal)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
                                <Divider sx={{ mb: 4 }} />
                                <Grid container spacing={4}>
                                    {/* Type chart (Cash vs Deposit) */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="subtitle2" color="text.secondary" align="center" fontWeight="bold" gutterBottom>
                                            DISTRIBUCIÓN TIPO DE INGRESO
                                        </Typography>
                                        <Box height={250} mt={2}>
                                            <PieChart
                                                series={[{
                                                    data: typeChartData,
                                                    innerRadius: 30,
                                                    arcLabel: (item) => `${((item.value / routeTotal) * 100).toFixed(0)}%`,
                                                }]}
                                                height={250}
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Collector breakdown chart */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="subtitle2" color="text.secondary" align="center" fontWeight="bold" gutterBottom>
                                            DISTRIBUCIÓN DE EFECTIVO POR COBRADOR
                                        </Typography>
                                        <Box height={250} mt={2}>
                                            {collectorChartData.length > 0 ? (
                                                <PieChart
                                                    series={[{
                                                        data: collectorChartData,
                                                        innerRadius: 30
                                                    }]}
                                                    height={250}
                                                />
                                            ) : (
                                                <Box display="flex" justifyContent="center" alignItems="center" height="100%" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        No hay ingresos registrados en efectivo.
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Detailed Lists */}
                                <Grid container spacing={4} mt={4}>
                                    {/* Cash list */}
                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" mb={2} color="success.main">Saldos en Efectivo:</Typography>
                                        <Stack spacing={1}>
                                            {(route.totalCash2 || []).map((c, i) => {
                                                const collector = collectors.find(u => u.id === c.collectorId);
                                                return (
                                                    <Box key={i} display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid" borderColor="divider">
                                                        <Typography variant="body2" color="text.secondary">
                                                            {collector ? collector.name : `Cobrador ID: ${c.collectorId}`}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight="bold">{FormatNumberToMoney(c.amount)}</Typography>
                                                    </Box>
                                                );
                                            })}
                                            {(route.totalCash2 || []).length === 0 && <Typography variant="caption" color="text.secondary">Sin movimientos en efectivo.</Typography>}
                                        </Stack>
                                    </Grid>

                                    {/* Deposits list */}
                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" mb={2} color="primary.main">Saldos en Cuentas (Bancos):</Typography>
                                        <Stack spacing={1}>
                                            {(route.totalDeposit || []).map((d, i) => {
                                                const bank = bankAccounts.find(b => b.id === d.bankAccountId);
                                                return (
                                                    <Box key={i} display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid" borderColor="divider">
                                                        <Typography variant="body2" color="text.secondary">
                                                            {bank ? `${bank.bankName} - ${bank.name}` : `ID: ${d.bankAccountId}`}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight="bold">{FormatNumberToMoney(d.amount)}</Typography>
                                                    </Box>
                                                );
                                            })}
                                            {(route.totalDeposit || []).length === 0 && <Typography variant="caption" color="text.secondary">Sin depósitos registrados.</Typography>}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Stack>
        </Box>
    );
};

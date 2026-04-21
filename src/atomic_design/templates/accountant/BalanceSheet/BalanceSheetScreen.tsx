import { useEffect, useState, useMemo } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    useTheme,
    Paper,
    Button,
    Stack,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import GroupIcon from "@mui/icons-material/Group";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CategoryIcon from "@mui/icons-material/Category";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeIcon from "@mui/icons-material/DateRange";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import SummaryOrchestrator from "../../../../features/summary/domain/infraestructure/SummaryOrchestrator";
import type { GetFinancialAggregatesOutput } from "../../../../features/summary/domain/business/useCases/GetFinancialAggregatesByDateRangeUseCase";

export const BalanceSheetScreen = () => {
    const theme = useTheme();
    const companyId = useAppSelector((state) => state.user.user?.companyId) || "";

    const [aggregates, setAggregates] = useState<GetFinancialAggregatesOutput | null>(null);

    const getPresetDates = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        return {
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
        };
    };

    const [currentRange, setCurrentRange] = useState<{ startDate: string; endDate: string; label: string }>({
        ...getPresetDates(30),
        label: "30"
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempStart, setTempStart] = useState(currentRange.startDate);
    const [tempEnd, setTempEnd] = useState(currentRange.endDate);

    const summaryOrchestrator = useMemo(() => new SummaryOrchestrator(), []);

    useEffect(() => {
        const fetchData = async () => {
            if (!companyId) return;
            try {
                setIsLoading(true);
                setError(null);

                const result = await summaryOrchestrator.getFinancialAggregatesByDateRange({
                    companyId,
                    startDate: currentRange.startDate,
                    endDate: currentRange.endDate,
                });

                if (result.ok) {
                    setAggregates(result.value);
                } else {
                    setError("Error al obtener los datos financieros.");
                }
            } catch (err) {
                console.error(err);
                setError("Ocurrió un error inesperado al cargar los datos.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [companyId, currentRange.startDate, currentRange.endDate, summaryOrchestrator]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handlePresetRange = (days: number) => {
        const dates = getPresetDates(days);
        setCurrentRange({ ...dates, label: days.toString() });
    };

    const handleOpenDialog = () => {
        setTempStart(currentRange.startDate);
        setTempEnd(currentRange.endDate);
        setIsDialogOpen(true);
    };

    const handleApplyCustomRange = () => {
        setCurrentRange({
            startDate: tempStart,
            endDate: tempEnd,
            label: "custom"
        });
        setIsDialogOpen(false);
    };

    // Validation: End date cannot be before start date
    const isInvalidRange = tempEnd < tempStart;

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <CircularProgress size={60} thickness={4} />
                <Typography sx={{ mt: 2 }} color="textSecondary">Cargando datos financieros...</Typography>
            </Box>
        );
    }

    const metricItems = [
        { label: "Recaudos (Clientes)", value: aggregates?.payments || 0, icon: <AccountBalanceWalletIcon />, color: theme.palette.success.main, bgcolor: theme.palette.success.light },
        { label: "Gastos Nómina", value: aggregates?.payroll || 0, icon: <GroupIcon />, color: theme.palette.info.main, bgcolor: theme.palette.info.light },
        { label: "Pagos Impuestos", value: aggregates?.taxtPayments || 0, icon: <ReceiptLongIcon />, color: theme.palette.warning.main, bgcolor: theme.palette.warning.light },
        { label: "Pagos de Financiación", value: aggregates?.financialPayments || 0, icon: <AccountBalanceIcon />, color: theme.palette.primary.main, bgcolor: theme.palette.primary.light },
        { label: "Otros Pagos", value: aggregates?.anotherPayments || 0, icon: <CategoryIcon />, color: theme.palette.error.main, bgcolor: theme.palette.error.light },
        { label: "Deudas Adquiridas", value: aggregates?.financialDebts || 0, icon: <CreditCardIcon />, color: theme.palette.secondary.main, bgcolor: theme.palette.secondary.light },
        { label: "Ingresos de Capital", value: aggregates?.incomes || 0, icon: <AddCircleIcon />, color: "#4caf50", bgcolor: "#e8f5e9" },
    ];

    return (
        <Box
            sx={{
                p: { xs: 2, md: 4 },
                minHeight: "100vh",
                backgroundColor: theme.palette.background.default,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Box sx={{ maxWidth: 1000, width: "100%" }}>
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography variant="h3" fontWeight="900" color="primary" gutterBottom>
                        entradas y salidas de dinero
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Desempeño financiero en el periodo seleccionado
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" alignItems="center" spacing={2} mb={5}>
                    <Button
                        variant={currentRange.label === "15" ? "contained" : "outlined"}
                        onClick={() => handlePresetRange(15)}
                        startIcon={<CalendarMonthIcon />}
                        sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: "bold" }}
                    >
                        Últimos 15 días
                    </Button>
                    <Button
                        variant={currentRange.label === "30" ? "contained" : "outlined"}
                        onClick={() => handlePresetRange(30)}
                        startIcon={<CalendarMonthIcon />}
                        sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: "bold" }}
                    >
                        Últimos 30 días
                    </Button>
                    <Button
                        variant={currentRange.label === "custom" ? "contained" : "outlined"}
                        onClick={handleOpenDialog}
                        startIcon={<DateRangeIcon />}
                        sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: "bold" }}
                    >
                        definir rango de tiempo
                    </Button>
                </Stack>

                {error && (
                    <Box sx={{ mb: 4, p: 2, bgcolor: "error.light", borderRadius: 2, color: "error.contrastText", textAlign: "center" }}>
                        <Typography>{error}</Typography>
                    </Box>
                )}

                <Grid container spacing={3} justifyContent="center">
                    {metricItems.map((item, index) => (
                        <Grid key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    height: "100%",
                                    borderRadius: 4,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-6px)",
                                        boxShadow: "0 12px 24px rgba(0,0,0,0.06)",
                                        borderColor: item.color
                                    }
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: item.bgcolor,
                                        color: item.color,
                                        display: "flex"
                                    }}>
                                        {item.icon}
                                    </Box>
                                    <Typography variant="subtitle2" color="textSecondary" fontWeight="800" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        {item.label}
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="900" color="textPrimary">
                                    {formatCurrency(item.value)}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ mt: 8, p: 4, borderRadius: 4, bgcolor: "action.hover", border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic", mb: 1 }}>
                        * Mostrando datos consolidados calculados desde <b>{currentRange.startDate}</b> hasta <b>{currentRange.endDate}</b>.
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Los valores se obtienen mediante agregaciones en tiempo real para garantizar precisión financiera.
                    </Typography>
                </Box>
            </Box>

            {/* Custom Range Dialog */}
            <Dialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 4, p: 1, minWidth: { sm: 400 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: "bold" }}>Definir Rango de Tiempo</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Fecha de Inicio"
                            type="date"
                            fullWidth
                            value={tempStart}
                            onChange={(e) => setTempStart(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Fecha Final"
                            type="date"
                            fullWidth
                            value={tempEnd}
                            onChange={(e) => setTempEnd(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            error={isInvalidRange}
                            helperText={isInvalidRange ? "La fecha final no puede ser anterior a la inicial" : ""}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setIsDialogOpen(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleApplyCustomRange}
                        variant="contained"
                        disabled={isInvalidRange || !tempStart || !tempEnd}
                        sx={{ borderRadius: 2 }}
                    >
                        Aplicar Rango
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

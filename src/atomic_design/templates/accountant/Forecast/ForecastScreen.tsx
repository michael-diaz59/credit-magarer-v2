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
import TimelineIcon from "@mui/icons-material/Timeline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeIcon from "@mui/icons-material/DateRange";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import InstallmentsOrchestrator from "../../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import type { GetInstallmentsSummaryOutput } from "../../../../features/debits/domain/business/useCases/installment/GetInstallmentsSummaryUseCase";

export const ForecastScreen = () => {
    const theme = useTheme();
    const companyId = useAppSelector((state) => state.user.user?.companyId) || "";

    const [summary, setSummary] = useState<GetInstallmentsSummaryOutput | null>(null);
    
    const getForecastDates = (days: number) => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);
        return {
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
        };
    };

    const [currentRange, setCurrentRange] = useState<{ startDate: string; endDate: string; label: string }>({
        ...getForecastDates(30),
        label: "30"
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempStart, setTempStart] = useState(currentRange.startDate);
    const [tempEnd, setTempEnd] = useState(currentRange.endDate);

    const installmentsOrchestrator = useMemo(() => new InstallmentsOrchestrator(), []);

    useEffect(() => {
        const fetchData = async () => {
            if (!companyId) return;
            try {
                setIsLoading(true);
                setError(null);

                const result = await installmentsOrchestrator.getInstallmentsSummary({
                    companyId,
                    startDate: currentRange.startDate,
                    endDate: currentRange.endDate,
                });

                if (result.ok) {
                    setSummary(result.value);
                } else {
                    setError("Error al obtener los pronósticos financieros.");
                }
            } catch (err) {
                console.error(err);
                setError("Ocurrió un error inesperado al cargar los datos.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [companyId, currentRange.startDate, currentRange.endDate, installmentsOrchestrator]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handlePresetRange = (days: number) => {
        const dates = getForecastDates(days);
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

    // Validations: 
    // 1. Start date cannot be in the past (before today)
    // 2. End date cannot be before start date
    const todayStr = new Date().toISOString().split("T")[0];
    const isStartInPast = tempStart < todayStr;
    const isEndBeforeStart = tempEnd < tempStart;
    const isInvalidRange = isStartInPast || isEndBeforeStart;

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <CircularProgress size={60} thickness={4} />
                <Typography sx={{ mt: 2 }} color="textSecondary">Procesando pronósticos...</Typography>
            </Box>
        );
    }

    const metricItems = [
        { 
            label: "Expectativa de Recaudo", 
            value: summary?.expectedPayment || 0, 
            icon: <MonetizationOnIcon />, 
            color: theme.palette.success.main, 
            bgcolor: theme.palette.success.light,
            description: "Total proyectado a recibir (Capital + Interés corriente)"
        },
        { 
            label: "Intereses de Mora Esperados", 
            value: summary?.paymentExpectedToDelay || 0, 
            icon: <WarningAmberIcon />, 
            color: theme.palette.error.main, 
            bgcolor: theme.palette.error.light,
            description: "Interés de mora proyectado por retrasos en el periodo"
        },
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
                    <Box sx={{ display: "inline-flex", p: 1.5, borderRadius: "50%", bgcolor: "primary.light", color: "primary.main", mb: 2 }}>
                        <TimelineIcon fontSize="large" />
                    </Box>
                    <Typography variant="h3" fontWeight="900" color="primary" gutterBottom>
                        Pronósticos Financieros
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Expectativas de ingresos y moras para el periodo seleccionado
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" alignItems="center" spacing={2} mb={6}>
                    <Button
                        variant={currentRange.label === "15" ? "contained" : "outlined"}
                        onClick={() => handlePresetRange(15)}
                        startIcon={<CalendarMonthIcon />}
                        sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: "bold" }}
                    >
                        Expectativas dentro de 15 días
                    </Button>
                    <Button
                        variant={currentRange.label === "30" ? "contained" : "outlined"}
                        onClick={() => handlePresetRange(30)}
                        startIcon={<CalendarMonthIcon />}
                        sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: "bold" }}
                    >
                        Expectativas dentro de 30 días
                    </Button>
                    <Button
                        variant={currentRange.label === "custom" ? "contained" : "outlined"}
                        onClick={handleOpenDialog}
                        startIcon={<DateRangeIcon />}
                        sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: "bold" }}
                    >
                        Expectativas en un rango de tiempo
                    </Button>
                </Stack>

                {error && (
                    <Box sx={{ mb: 4, p: 2, bgcolor: "error.light", borderRadius: 2, color: "error.contrastText", textAlign: "center" }}>
                        <Typography>{error}</Typography>
                    </Box>
                )}

                <Grid container spacing={4} justifyContent="center">
                    {metricItems.map((item, index) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: "100%",
                                    borderRadius: 5,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                        transform: "scale(1.02)",
                                        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                                        borderColor: item.color
                                    }
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        bgcolor: item.bgcolor,
                                        color: item.color,
                                        display: "flex",
                                        boxShadow: `0 8px 16px ${item.bgcolor}`
                                    }}>
                                        {item.icon}
                                    </Box>
                                    <Typography variant="h6" color="textSecondary" fontWeight="800" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                        {item.label}
                                    </Typography>
                                </Box>
                                <Typography variant="h2" fontWeight="900" color="textPrimary" sx={{ mb: 1 }}>
                                    {formatCurrency(item.value)}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {item.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ mt: 10, p: 4, borderRadius: 5, bgcolor: "action.hover", border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic", mb: 1, fontWeight: "bold" }}>
                        * Pronóstico calculado en el rango: {currentRange.startDate} — {currentRange.endDate}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: "block", maxWidth: 600, mx: "auto" }}>
                        Este análisis proyecta los ingresos basados en las fechas de vencimiento de las cuotas activas. 
                        No tiene en cuenta posibles refinanciaciones o cancelaciones anticipadas fuera del periodo.
                    </Typography>
                </Box>
            </Box>

            {/* Custom Range Dialog */}
            <Dialog 
                open={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 5, p: 2, minWidth: { sm: 450 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: "900", fontSize: "1.5rem" }}>📅 Seleccionar Rango Futuro</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Seleccione un periodo a futuro para proyectar los recaudos esperados.
                    </Typography>
                    <Stack spacing={4}>
                        <TextField
                            label="Fecha de Inicio"
                            type="date"
                            fullWidth
                            value={tempStart}
                            onChange={(e) => setTempStart(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            error={isStartInPast}
                            helperText={isStartInPast ? "La fecha de inicio no puede ser menor a la actual" : ""}
                            inputProps={{ min: todayStr }}
                        />
                        <TextField
                            label="Fecha Final"
                            type="date"
                            fullWidth
                            value={tempEnd}
                            onChange={(e) => setTempEnd(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            error={isEndBeforeStart}
                            helperText={isEndBeforeStart ? "La fecha final no puede ser anterior a la inicial" : ""}
                            inputProps={{ min: tempStart }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setIsDialogOpen(false)} color="inherit" sx={{ fontWeight: "bold" }}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleApplyCustomRange} 
                        variant="contained" 
                        disabled={isInvalidRange || !tempStart || !tempEnd}
                        sx={{ borderRadius: 3, px: 4, fontWeight: "bold" }}
                    >
                        Ver Pronóstico
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

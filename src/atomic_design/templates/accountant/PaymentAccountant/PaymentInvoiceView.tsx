import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Divider,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import type { Payment } from "../../../../features/debits/domain/business/entities/Payment";
import { LoadingOverlay } from "../../../molecules/LoadingOverlay";
import { formatDateTime } from "../../../sub_atomic_particles/helpers";

type Props = {
    payment: Payment;
    isLoading: boolean;
    onSaveObservation: (text: string) => void;
    onDescuadre: (amount: number) => void;
};

export const PaymentInvoiceView = ({
    payment,
    onSaveObservation,
    onDescuadre,
    isLoading,
}: Props) => {
    const [accountantObservation, setAccountantObservation] = useState("");

    useEffect(() => {
        setAccountantObservation(payment.accountantObservation || "");
    }, [payment]);

    const [openDialog, setOpenDialog] = useState(false);
    const [descuadreAmount, setDescuadreAmount] = useState(0);

    const handleSave = () => {
        onSaveObservation(accountantObservation);
    };

    const handleDescuadre = () => {
        if (descuadreAmount > payment.amount) return;
        onDescuadre(descuadreAmount);
        setOpenDialog(false);
    };

    return (
        <>
            <LoadingOverlay open={isLoading} text="cargando" />
            <Box p={4} display="flex" justifyContent="center">
                <Paper sx={{ width: 600, p: 4 }}>
                    {/* Header */}
                    <Typography variant="h5" fontWeight="bold" align="center" mb={2}>
                        Comprobante de Pago
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <Box mb={2}>
                        <Typography
                            variant="h6"
                            color={payment.isTight ? "success.main" : "error"}
                            fontWeight="bold"
                        >
                            {payment.isTight
                                ? "Este pago ha sido cuadrado"
                                : "Este pago NO ha sido cuadrado"}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Info */}
                    <Box mb={2}>
                        <Typography><b>Cobrador:</b> {payment.collectorName}</Typography>
                        <Typography><b>Cliente:</b> {payment.costumerName}</Typography>
                        <Typography><b>Fecha:</b> {formatDateTime(payment.paidAt)}</Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Metodo de pago */}
                    <Box mb={2}>
                        <Typography>
                            <b>Método de pago:</b>{" "}
                            {payment.method === "efectivo"
                                ? "Efectivo"
                                : "Consignación"}
                        </Typography>

                        <Typography>
                            <b>Cuenta:</b>{" "}
                            {payment.method === "efectivo"
                                ? "Pago en efectivo"
                                : payment.bankAccountId}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Observaciones cobrador */}
                    <Box mb={2}>
                        <Typography fontWeight="bold">
                            Observaciones del cobrador
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            <Typography>
                                {payment.collectorObservation || "Sin observaciones"}
                            </Typography>
                        </Paper>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Total */}
                    <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="h6">Total pagado</Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                            {FormatNumberToMoney(payment.amount)}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Observaciones contador */}
                    <Box mb={3}>
                        <Typography fontWeight="bold">
                            Observaciones del contador
                        </Typography>
                        <TextField
                            fullWidth

                            multiline
                            rows={3}
                            value={accountantObservation}
                            onChange={(e) => {
                                setAccountantObservation(e.target.value)
                            }}
                            sx={{ mt: 1 }}
                        />
                    </Box>

                    {/* Botones */}
                    <Box display="flex" justifyContent="space-between">
                        <Button variant="contained" onClick={handleSave}>
                            Guardar observación
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box display="flex" justifyContent="space-between">
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setOpenDialog(true)}
                        >
                            Descuadre
                        </Button>
                    </Box>
                </Paper>

                {/* Dialog Descuadre */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>Registrar Descuadre</DialogTitle>
                    <DialogContent>
                        <Typography mb={2}>
                            ¿Cuánto se va a descontar al cobrador?
                        </Typography>

                        <TextField
                            type="number"
                            fullWidth
                            value={descuadreAmount}
                            onChange={(e) =>
                                setDescuadreAmount(Number(e.target.value))
                            }
                            inputProps={{
                                min: 0,
                                max: payment.amount,
                            }}
                            helperText={`Máximo: ${FormatNumberToMoney(payment.amount)}`}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                        <Button color="error" onClick={handleDescuadre}>
                            Confirmar descuadre
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </>
    );
};
import {
    Box,
    Typography,
    Card,
    CardContent,
    Stack,
    Chip,
    Button,
    Divider,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    MenuItem,
    Select,
    InputLabel,
    Checkbox,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Controller } from "react-hook-form";

import type { PaymentMethod } from "../../../../features/debits/domain/business/entities/Payment";
import { DebtRenewalModule } from "../../../organisms/DebtRenewalModule";
import { BaseDialog } from "../../../atoms/BaseDialog";
import type {
    UseInstallmentDetail,
    PartialPaymentForm,
} from "./UseInstallmentDetail";

type InstallmentDetailViewProps = ReturnType<typeof UseInstallmentDetail>;

export const InstallmentDetailView = ({
    installment,
    debt,
    installmentsOfDebt,
    loading,
    companyId,

    dialogOpen,
    dialogTitle,
    dialogBody,

    attemptDialogOpen,
    attemptDescription,
    attemptLoading,

    partialPaymentDialogOpen,

    locationDialogOpen,

    paymentMethodDialogOpen,
    selectedMethod,
    proofFile,

    bankAccounts,
    selectedBankAccountId,

    canBePaid,
    maxPaymentAmount,
    remainingBalance,

    control,
    handleSubmit,
    errors,

    setAttemptDialogOpen,
    setAttemptDescription,
    setPartialPaymentDialogOpen,
    setSelectedMethod,
    setSelectedBankAccountId,
    setPaymentMethodDialogOpen,

    handleCloseDialog,
    handlePaymentMethodConfirm,
    handleLocationDialogResponse,
    handleFullPayment,
    onPartialPaymentSubmit,
    handleRegisterAttempt,
    handleToggleManaged,
    handleFileChange,
    handleCallClient,
    handleWhatsAppClient,
    handleNavigateToDebt,
    handleRenewalSuccess,
    handleOpenPartialPayment,
}: InstallmentDetailViewProps) => {
    if (loading && !installment) {
        return (
            <Box
                height="70vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!installment) {
        return (
            <Box p={2}>
                <Typography>No se encontró la cuota</Typography>
            </Box>
        );
    }

    const getStatusColor = (
        status: string,
    ): "error" | "warning" | "success" => {
        if (status === "pendiente") return "error";
        if (status === "incompleto") return "warning";
        return "success";
    };

    const today = new Date().toISOString().split("T")[0];

    return (
        <Box p={2}>
            <BaseDialog
                open={dialogOpen}
                title={dialogTitle}
                body={dialogBody}
                butonText="Aceptar"
                onClick={handleCloseDialog}
            />

            {/* LOCATION DIALOG */}
            <Dialog
                open={locationDialogOpen}
                onClose={() => handleLocationDialogResponse(false)}
            >
                <DialogTitle>Ubicación no disponible</DialogTitle>

                <DialogContent>
                    <Typography>
                        No se pudo obtener su ubicación actual. ¿Desea registrar el pago
                        de todas formas?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => handleLocationDialogResponse(false)}>
                        Cancelar
                    </Button>

                    <Button
                        onClick={() => handleLocationDialogResponse(true)}
                        variant="contained"
                        autoFocus
                    >
                        Registrar sin ubicación
                    </Button>
                </DialogActions>
            </Dialog>

            {/* PAYMENT METHOD DIALOG */}
            <Dialog
                open={paymentMethodDialogOpen}
                onClose={() => setPaymentMethodDialogOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Método de Pago</DialogTitle>

                <DialogContent>
                    <FormControl component="fieldset" margin="normal">
                        <FormLabel component="legend">
                            Seleccione el método
                        </FormLabel>

                        <RadioGroup
                            value={selectedMethod}
                            onChange={(event) =>
                                setSelectedMethod(event.target.value as PaymentMethod)
                            }
                        >
                            <FormControlLabel
                                value="efectivo"
                                control={<Radio />}
                                label="Efectivo"
                            />

                            <FormControlLabel
                                value="consignacion"
                                control={<Radio />}
                                label="Consignación"
                            />
                        </RadioGroup>
                    </FormControl>

                    {selectedMethod === "consignacion" && (
                        <Box mt={2}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel id="bank-account-label">
                                    Cuenta Bancaria
                                </InputLabel>

                                <Select
                                    labelId="bank-account-label"
                                    value={selectedBankAccountId}
                                    label="Cuenta Bancaria"
                                    onChange={(event) =>
                                        setSelectedBankAccountId(event.target.value)
                                    }
                                >
                                    {bankAccounts.map((account) => (
                                        <MenuItem key={account.id} value={account.id}>
                                            {account.bankName} - {account.name} (Tope: $
                                            {account.tope.toLocaleString()})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                {proofFile ? proofFile.name : "Subir Comprobante"}

                                <input
                                    type="file"
                                    hidden
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                />
                            </Button>

                            {!proofFile && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    display="block"
                                    mt={1}
                                >
                                    * Comprobante requerido
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setPaymentMethodDialogOpen(false)}
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handlePaymentMethodConfirm}
                        variant="contained"
                        disabled={
                            selectedMethod === "consignacion" &&
                            (!proofFile || !selectedBankAccountId)
                        }
                    >
                        Continuar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO INTENTO DE COBRO */}
            <Dialog
                open={attemptDialogOpen}
                onClose={() =>
                    !attemptLoading && setAttemptDialogOpen(false)
                }
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Registrar Intento de Cobro</DialogTitle>

                <DialogContent>
                    <Box mt={1}>
                        <Typography
                            variant="body2"
                            gutterBottom
                            color="text.secondary"
                        >
                            Describe brevemente por qué no se pudo completar el cobro.
                        </Typography>

                        <TextField
                            autoFocus
                            margin="dense"
                            label="Descripción del intento"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={attemptDescription}
                            onChange={(event) =>
                                setAttemptDescription(event.target.value)
                            }
                            disabled={attemptLoading}
                        />
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setAttemptDialogOpen(false)}
                        disabled={attemptLoading}
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleRegisterAttempt}
                        variant="contained"
                        color="primary"
                        disabled={attemptLoading || !attemptDescription.trim()}
                    >
                        {attemptLoading ? (
                            <CircularProgress size={24} />
                        ) : (
                            "Registrar Intento"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIALOGO PAGO PARCIAL */}
            <Dialog
                open={partialPaymentDialogOpen}
                onClose={() => setPartialPaymentDialogOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Registrar Pago Parcial</DialogTitle>

                <DialogContent>
                    <Box mt={1}>
                        <Typography variant="body2" gutterBottom>
                            Monto pendiente: ${maxPaymentAmount.toLocaleString()}
                        </Typography>

                        <form
                            id="partial-payment-form"
                            onSubmit={handleSubmit(onPartialPaymentSubmit)}
                        >
                            <Controller<PartialPaymentForm>
                                name="amount"
                                control={control}
                                rules={{
                                    required: "El monto es obligatorio",
                                    min: {
                                        value: 1,
                                        message: "El monto debe ser mayor a 0",
                                    },
                                    max: {
                                        value: maxPaymentAmount,
                                        message:
                                            `El monto no puede superar $${maxPaymentAmount.toLocaleString()}`,
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Monto a pagar"
                                        type="number"
                                        fullWidth
                                        error={!!errors.amount}
                                        helperText={errors.amount?.message}
                                        autoFocus
                                    />
                                )}
                            />
                        </form>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setPartialPaymentDialogOpen(false)}
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        form="partial-payment-form"
                        variant="contained"
                    >
                        Continuar
                    </Button>
                </DialogActions>
            </Dialog>

            <Typography variant="h5" mb={2}>
                Detalle de la cuota
            </Typography>

            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        {/* ESTADO */}
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >
                            <Chip
                                label={installment.status.replace("_", " ")}
                                color={getStatusColor(installment.status)}
                            />

                            {installment.amountPaid &&
                                installment.amountPaid > 0 ? (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Pagado: $
                                    {installment.amountPaid.toLocaleString()} / $
                                    {installment.amount.toLocaleString()}
                                </Typography>
                            ) : null}
                        </Stack>

                        {/* CLIENTE */}
                        <Box>
                            <Typography variant="body2">
                                Cliente: {installment.clientName}
                            </Typography>

                            <Typography variant="body2">
                                Documento: {installment.clientDocument}
                            </Typography>
                        </Box>

                        {/* DIRECCIÓN */}
                        <Box>
                            <Typography variant="body2">
                                Dirección: {installment.clientAddres.address}
                            </Typography>

                            <Typography variant="body2">
                                Barrio: {installment.clientAddres.neighborhood}
                                <br />
                                Ciudad: {installment.clientAddres.city}
                            </Typography>
                        </Box>

                        {/* CONTACTO */}
                        {installment.clientNumber && (
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    mb={1}
                                >
                                    Contactar cliente
                                </Typography>

                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<PhoneIcon />}
                                        onClick={() =>
                                            handleCallClient(installment.clientNumber)
                                        }
                                    >
                                        Llamar
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="success"
                                        startIcon={<WhatsAppIcon />}
                                        onClick={() =>
                                            handleWhatsAppClient(installment.clientNumber)
                                        }
                                    >
                                        WhatsApp
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        <Divider />

                        {/* INFO CUOTA */}
                        <Box>
                            <Typography variant="body2">
                                Cuota {installment.installmentNumber}
                            </Typography>

                            <Typography variant="h6">
                                Valor base ${installment.amount.toLocaleString()}
                            </Typography>

                            <Typography variant="h6">
                                Cargo por aplazamiento ${installment.deferment.toLocaleString()}
                            </Typography>

                            <Typography variant="h6">
                                Cargo por mora ${installment.arrears.toLocaleString()}
                            </Typography>

                            <Typography variant="h6">
                                total acordado ${(installment.amount + installment.arrears).toLocaleString()}
                            </Typography>

                            <Typography variant="h6">
                                total con mora ${(installment.total).toLocaleString()}
                            </Typography>

                            <Typography variant="body2">
                                Vence:{" "}
                                {installment.dueDate}
                            </Typography>

                            <Typography variant="h6">
                                Dias de mora: {installment.numberOfArrearsDays}
                            </Typography>
                        </Box>

                        {/* GESTIÓN DIARIA */}
                        <Box
                            border="1px solid"
                            borderColor="divider"
                            borderRadius={2}
                            p={1}
                            bgcolor="rgba(0,0,0,0.02)"
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={
                                            !!installment.managed &&
                                            installment.managementDate === today
                                        }
                                        onChange={handleToggleManaged}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            fontWeight="500"
                                        >
                                            Gestionado hoy
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Indica que ya contactaste u operaste
                                            sobre esta cuota.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>

                        {/* ACCIÓN */}
                        {canBePaid && (
                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    disabled={loading}
                                    onClick={handleFullPayment}
                                    startIcon={
                                        loading ? (
                                            <CircularProgress size={20} />
                                        ) : null
                                    }
                                >
                                    {loading ? "Procesando..." : "Pago Completo"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                    onClick={handleOpenPartialPayment}
                                >
                                    Abono
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="warning"
                                    size="large"
                                    disabled={loading || attemptLoading}
                                    onClick={() => setAttemptDialogOpen(true)}
                                >
                                    Intento de Cobro
                                </Button>

                                <Button
                                    variant="text"
                                    color="primary"
                                    fullWidth
                                    onClick={handleNavigateToDebt}
                                    sx={{ mt: 1 }}
                                >
                                    Ver todas las cuotas de esta deuda
                                </Button>

                                {debt && (
                                    <Box
                                        mt={2}
                                        borderTop="1px solid"
                                        borderColor="divider"
                                        pt={2}
                                    >
                                        <DebtRenewalModule
                                            companyId={companyId}
                                            currentDebt={debt}
                                            context="collector"
                                            totalPaid={installmentsOfDebt.reduce(
                                                (acc, curr) =>
                                                    acc + (curr.amountPaid || 0),
                                                0,
                                            )}
                                            remainingBalance={remainingBalance}
                                            buttonVariant="contained"
                                            buttonColor="secondary"
                                            buttonText="Renovar Deuda"
                                            onSuccess={handleRenewalSuccess}
                                        />
                                    </Box>
                                )}
                            </Stack>
                        )}

                        {!canBePaid && (
                            <Typography color="text.secondary">
                                Esta cuota ya no puede ser modificada
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};
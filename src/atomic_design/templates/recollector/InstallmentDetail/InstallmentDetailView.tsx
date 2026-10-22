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
import { alpha } from "@mui/material/styles";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Controller } from "react-hook-form";

import type { PaymentMethod } from "../../../../features/debits/domain/business/entities/Payment";
import { DebtRenewalModule } from "../../../organisms/DebtRenewalModule";
import { BaseDialog } from "../../../atoms/BaseDialog";
import type {
    UseInstallmentDetail,
    PartialPaymentForm,
} from "./UseInstallmentDetail";
import { getLocalDate } from "../../../../core/helpers/dates/calculateDays";
import { HasValidCoordinates } from "../../../../core/shared/helpers/geoLocation";

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
    onPartialPaymentSubmit,
    handleRegisterAttempt,
    handleToggleManaged,
    handleFileChange,
    handleCallClient,
    handleWhatsAppClient,
    handleNavigateToDebt,
    handleRenewalSuccess,
    handleOpenPartialPayment,

    creditFinancialSummary,
    liquidationSimulation,
    currentInstallmentArrears,
    handlePayCurrentInstallment,
    handlePayDueToday,
    handlePayoffDebt,
    handleSetAbonoPreset,
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

    const today = getLocalDate(new Date())

    return (
        <Box p={2}>
            <BaseDialog
                open={dialogOpen}
                title={dialogTitle}
                body={dialogBody}
                butonText="Aceptar"
                onClick={handleCloseDialog}
            />

            {/* dialogo de ubicacion */}
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

            {/* dialogo de metodos de pago inicial */}
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
                        Pagar
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

            {/* DIALOGO de abono */}
            <Dialog
                open={partialPaymentDialogOpen}
                onClose={() => setPartialPaymentDialogOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Registrar Pago / Abono</DialogTitle>

                <DialogContent>
                    <Box mt={1}>
                        <Box
                            mb={2}
                            p={1.5}
                            borderRadius={2}
                            bgcolor={(theme) => alpha(theme.palette.info.main, 0.06)}
                            border="1px solid"
                            borderColor={(theme) => alpha(theme.palette.info.main, 0.2)}
                        >
                            <Typography variant="subtitle2" color="info.dark" fontWeight="bold">
                                Límites y capacidades de la deuda:
                            </Typography>
                            <Typography variant="body2" mt={0.5}>
                                • <strong>Para quedar al día hoy:</strong> ${creditFinancialSummary.totalDueToday.toLocaleString("es-CO")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" ml={1.5}>
                                (Base: ${creditFinancialSummary.totalBaseAmount.toLocaleString("es-CO")} | Mora/Aplazamiento: ${(creditFinancialSummary.totalDelayArrears + creditFinancialSummary.totalDefermentArrears).toLocaleString("es-CO")})
                            </Typography>

                            {liquidationSimulation && (
                                <>
                                    <Typography variant="body2" mt={0.5}>
                                        • <strong>Total para liquidar crédito:</strong> ${liquidationSimulation.totalPayoff.toLocaleString("es-CO")}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" ml={1.5}>
                                        (Máx. Base: ${liquidationSimulation.maxAllowedBase.toLocaleString("es-CO")} | Máx. Mora: ${liquidationSimulation.maxAllowedArrears.toLocaleString("es-CO")})
                                    </Typography>
                                </>
                            )}
                        </Box>

                        <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={0.75}>
                            Autocompletar valor sugerido:
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" mb={2} useFlexGap>
                            <Chip
                                label={`Cuota #${installment.installmentNumber}: $${(currentInstallmentArrears?.totalDueThisInstallment ?? installment.outstandingReceivables).toLocaleString("es-CO")}`}
                                size="small"
                                onClick={() => handleSetAbonoPreset("current")}
                                clickable
                                color="default"
                                variant="outlined"
                            />
                            {creditFinancialSummary.totalDueTodayCount > 1 && (
                                <Chip
                                    label={`Quedar al día hoy: $${creditFinancialSummary.totalDueToday.toLocaleString("es-CO")}`}
                                    size="small"
                                    onClick={() => handleSetAbonoPreset("dueToday")}
                                    clickable
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                            {liquidationSimulation && (
                                <Chip
                                    label={`Liquidar crédito: $${liquidationSimulation.totalPayoff.toLocaleString("es-CO")}`}
                                    size="small"
                                    onClick={() => handleSetAbonoPreset("payoff")}
                                    clickable
                                    color="info"
                                    variant="outlined"
                                />
                            )}
                        </Stack>

                        <form
                            id="partial-payment-form"
                            onSubmit={handleSubmit(onPartialPaymentSubmit)}
                        >
                            <Controller<PartialPaymentForm>
                                name="amount"
                                control={control}
                                rules={{
                                    min: {
                                        value: 0,
                                        message: "El monto debe ser mayor o igual a 0",
                                    },
                                    max: {
                                        value: liquidationSimulation
                                            ? liquidationSimulation.maxAllowedBase
                                            : installment.outstandingReceivablesAmount,
                                        message: `El monto base no puede superar $${(
                                            liquidationSimulation
                                                ? liquidationSimulation.maxAllowedBase
                                                : installment.outstandingReceivablesAmount
                                        ).toLocaleString("es-CO")}`,
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? 0}
                                        onChange={(event) => field.onChange(Number(event.target.value))}
                                        label="Monto base a pagar (Capital + Interés)"
                                        type="number"
                                        fullWidth
                                        error={!!errors.amount}
                                        helperText={
                                            errors.amount?.message ||
                                            `Límite permitido: $${(liquidationSimulation?.maxAllowedBase ?? installment.outstandingReceivablesAmount).toLocaleString("es-CO")}`
                                        }
                                        autoFocus
                                    />
                                )}
                            />

                            <Box sx={{ mt: 2.5 }} />

                            <Controller<PartialPaymentForm>
                                name="arrears"
                                control={control}
                                rules={{
                                    min: {
                                        value: 0,
                                        message: "El monto debe ser mayor o igual a 0",
                                    },
                                    max: {
                                        value: liquidationSimulation
                                            ? liquidationSimulation.maxAllowedArrears
                                            : (currentInstallmentArrears?.pendingArrears ?? 0) + (currentInstallmentArrears?.pendingDeferment ?? 0),
                                        message: `La mora no puede superar $${(
                                            liquidationSimulation
                                                ? liquidationSimulation.maxAllowedArrears
                                                : (currentInstallmentArrears?.pendingArrears ?? 0) + (currentInstallmentArrears?.pendingDeferment ?? 0)
                                        ).toLocaleString("es-CO")}`,
                                    },
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value ?? 0}
                                        onChange={(event) => field.onChange(Number(event.target.value))}
                                        label="Mora / aplazamiento a pagar"
                                        type="number"
                                        fullWidth
                                        error={!!errors.arrears}
                                        helperText={
                                            errors.arrears?.message ||
                                            `Límite permitido: $${(liquidationSimulation?.maxAllowedArrears ?? ((currentInstallmentArrears?.pendingArrears ?? 0) + (currentInstallmentArrears?.pendingDeferment ?? 0))).toLocaleString("es-CO")}`
                                        }
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
                        Pagar abono
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

                            {HasValidCoordinates(installment.clientAddres.locationGPS?.coordinates) && (
                                <Box>
                                    <Typography variant="body2">
                                        Coordenadas: {installment.clientAddres.locationGPS?.coordinates}
                                    </Typography>

                                    <Button onClick={() => window.open(`https://www.google.com/maps?q=${installment.clientAddres.locationGPS?.coordinates}`, "_blank")}>
                                        Abrir en mapa
                                    </Button>
                                </Box>
                            )}
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
                                            Indica que ya contactaste u operaste sobre esta cuota.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* RESUMEN FINANCIERO DEL CRÉDITO COMPLETO */}
            <Card
                variant="outlined"
                sx={{
                    mb: 2,
                    mt: 2,
                    borderRadius: 2.5,
                    borderColor: creditFinancialSummary.overdueCount > 0 ? "error.main" : "divider",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
            >
                <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} gap={1}>
                        <Box display="flex" alignItems="center" gap={1.2}>
                            <Box
                                sx={{
                                    bgcolor: (theme) =>
                                        alpha(
                                            creditFinancialSummary.overdueCount > 0 ? theme.palette.error.main : theme.palette.primary.main,
                                            0.12
                                        ),
                                    color: creditFinancialSummary.overdueCount > 0 ? "error.main" : "primary.main",
                                    borderRadius: 2,
                                    p: 0.9,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <CreditCardIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography fontWeight="bold" variant="subtitle1" lineHeight={1.2}>
                                    Crédito: {debt?.name || installment.debtName || "Crédito"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {creditFinancialSummary.totalActiveCount} cuota{creditFinancialSummary.totalActiveCount !== 1 ? "s" : ""} pendiente{creditFinancialSummary.totalActiveCount !== 1 ? "s" : ""}
                                    {debt?.debtTerms ? ` • Modalidad ${debt.debtTerms}` : ""}
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={0.75} flexWrap="wrap">
                            {creditFinancialSummary.overdueCount > 0 && (
                                <Chip
                                    label={`${creditFinancialSummary.overdueCount} en mora`}
                                    color="error"
                                    size="small"
                                    variant="filled"
                                    sx={{ fontWeight: "bold" }}
                                />
                            )}
                            {creditFinancialSummary.dueTodayCount > 0 && (
                                <Chip
                                    label={`${creditFinancialSummary.dueTodayCount} para hoy`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                            {creditFinancialSummary.futureCount > 0 && (
                                <Chip
                                    label={`${creditFinancialSummary.futureCount} futura${creditFinancialSummary.futureCount !== 1 ? "s" : ""}`}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Stack>
                    </Box>

                    <Divider sx={{ my: 1.2 }} />

                    <Stack spacing={0.75}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                                Suma cuotas exigibles a la fecha (Capital + Interés):
                            </Typography>
                            <Typography variant="body2" fontWeight="600">
                                ${creditFinancialSummary.totalBaseAmount.toLocaleString("es-CO")}
                            </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography
                                variant="body2"
                                color={creditFinancialSummary.totalDelayArrears > 0 ? "error.main" : "text.secondary"}
                            >
                                Mora por retraso acumulada (hasta hoy):
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight="600"
                                color={creditFinancialSummary.totalDelayArrears > 0 ? "error.main" : "text.primary"}
                            >
                                ${creditFinancialSummary.totalDelayArrears.toLocaleString("es-CO")}
                            </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography
                                variant="body2"
                                color={creditFinancialSummary.totalDefermentArrears > 0 ? "warning.main" : "text.secondary"}
                            >
                                Mora por aplazamiento (hasta hoy):
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight="600"
                                color={creditFinancialSummary.totalDefermentArrears > 0 ? "warning.dark" : "text.primary"}
                            >
                                ${creditFinancialSummary.totalDefermentArrears.toLocaleString("es-CO")}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 0.5, borderStyle: "dashed" }} />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight="bold">
                                Total para quedar a paz y salvo a hoy:
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                                ${creditFinancialSummary.totalDueToday.toLocaleString("es-CO")}
                            </Typography>
                        </Box>
                    </Stack>

                    {liquidationSimulation && (
                        <Box
                            sx={{
                                mt: 1.5,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                                border: "1px solid",
                                borderColor: (theme) => alpha(theme.palette.info.main, 0.25),
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Box display="flex" alignItems="center" gap={0.8}>
                                    <AccountBalanceWalletIcon fontSize="small" color="info" />
                                    <Typography variant="subtitle2" fontWeight="bold" color="info.dark">
                                        Saldo real para liquidar crédito
                                    </Typography>
                                </Box>
                                <Chip
                                    label={liquidationSimulation.isFixed ? "Tipo Fijo" : "Tipo Variable"}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                            </Box>

                            <Stack spacing={0.5}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">
                                        • Capital restante ({debt?.type ?? "fijo"}):
                                    </Typography>
                                    <Typography variant="caption" fontWeight="600">
                                        ${liquidationSimulation.remainingCapital.toLocaleString("es-CO")}
                                    </Typography>
                                </Box>

                                {liquidationSimulation.overdueInterest > 0 && (
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="caption" color="error.main" fontWeight="500">
                                            • Intereses cuotas vencidas ({creditFinancialSummary.overdueCount} cuota{creditFinancialSummary.overdueCount !== 1 ? "s" : ""}):
                                        </Typography>
                                        <Typography variant="caption" fontWeight="600" color="error.main">
                                            + ${liquidationSimulation.overdueInterest.toLocaleString("es-CO")}
                                        </Typography>
                                    </Box>
                                )}

                                {liquidationSimulation.nextInstallmentInterest > 0 && (
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">
                                            • Interés próxima cuota {liquidationSimulation.nextInstallmentNumber ? `#${liquidationSimulation.nextInstallmentNumber}` : ""}:
                                        </Typography>
                                        <Typography variant="caption" fontWeight="600">
                                            + ${liquidationSimulation.nextInstallmentInterest.toLocaleString("es-CO")}
                                        </Typography>
                                    </Box>
                                )}

                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">
                                        • Mora por aplazamiento (total restante):
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        fontWeight="600"
                                        color={liquidationSimulation.remainingDeferment > 0 ? "warning.dark" : "text.secondary"}
                                    >
                                        + ${liquidationSimulation.remainingDeferment.toLocaleString("es-CO")}
                                    </Typography>
                                </Box>

                                {liquidationSimulation.delayArrears > 0 && (
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="caption" color="error.main">
                                            • Mora por retraso acumulada:
                                        </Typography>
                                        <Typography variant="caption" fontWeight="600" color="error.main">
                                            + ${liquidationSimulation.delayArrears.toLocaleString("es-CO")}
                                        </Typography>
                                    </Box>
                                )}

                                <Divider sx={{ my: 0.5, borderStyle: "dotted" }} />

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight="bold" color="info.dark">
                                        Total para cancelar crédito:
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight="bold" color="info.dark">
                                        ${liquidationSimulation.totalPayoff.toLocaleString("es-CO")}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* DETALLE DE LA CUOTA SELECCIONADA */}
            <Card variant="outlined" sx={{ borderRadius: 2.5, mb: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <CardContent sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight="bold">
                                Cuota Seleccionada #{installment.installmentNumber}
                            </Typography>
                            <Chip
                                label={installment.status.replace("_", " ")}
                                color={getStatusColor(installment.status)}
                                size="small"
                            />
                        </Box>

                        <Divider />

                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                                Fecha de vencimiento:
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                                {installment.dueDate || "N/A"}
                            </Typography>
                        </Box>

                        {(currentInstallmentArrears?.delayDays ?? installment.numberOfArrearsDays) > 0 && (
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="error.main">
                                    Días de retraso:
                                </Typography>
                                <Typography variant="body2" fontWeight="600" color="error.main">
                                    {currentInstallmentArrears?.delayDays ?? installment.numberOfArrearsDays} días
                                </Typography>
                            </Box>
                        )}

                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                                Monto base pendiente:
                            </Typography>
                            <Typography variant="body2" fontWeight="600">
                                ${(installment.outstandingReceivablesAmount ?? installment.amount).toLocaleString("es-CO")}
                            </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                                Mora por retraso cuota:
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight="600"
                                color={(currentInstallmentArrears?.pendingArrears ?? installment.outstandingReceivablesArrears ?? 0) > 0 ? "error.main" : "text.secondary"}
                            >
                                ${(currentInstallmentArrears?.pendingArrears ?? installment.outstandingReceivablesArrears ?? 0).toLocaleString("es-CO")}
                            </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                                Aplazamiento cuota:
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight="600"
                                color={(currentInstallmentArrears?.pendingDeferment ?? installment.outstandingReceivablesDeferment ?? 0) > 0 ? "warning.dark" : "text.secondary"}
                            >
                                ${(currentInstallmentArrears?.pendingDeferment ?? installment.outstandingReceivablesDeferment ?? 0).toLocaleString("es-CO")}
                            </Typography>
                        </Box>

                        <Divider sx={{ borderStyle: "dashed" }} />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight="bold">
                                Total de esta cuota:
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                                ${(currentInstallmentArrears?.totalDueThisInstallment ?? installment.outstandingReceivables).toLocaleString("es-CO")}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* ACCIONES DE COBRO Y PAGO */}
            {canBePaid && (
                <Stack spacing={1.5} mb={2}>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        disabled={loading}
                        onClick={handlePayCurrentInstallment}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                        sx={{ py: 1.2, fontWeight: "bold" }}
                    >
                        Pagar Cuota #{installment.installmentNumber} ($
                        {(currentInstallmentArrears?.totalDueThisInstallment ?? installment.outstandingReceivables).toLocaleString("es-CO")})
                    </Button>

                    {creditFinancialSummary.totalDueTodayCount > 1 && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={loading}
                            onClick={handlePayDueToday}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                            sx={{ py: 1.2, fontWeight: "bold" }}
                        >
                            Quedar a Paz y Salvo a Hoy (${creditFinancialSummary.totalDueToday.toLocaleString("es-CO")})
                        </Button>
                    )}

                    {liquidationSimulation && liquidationSimulation.totalPayoff > 0 && (
                        <Button
                            variant="contained"
                            color="info"
                            size="large"
                            disabled={loading}
                            onClick={handlePayoffDebt}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                            sx={{ py: 1.2, fontWeight: "bold" }}
                        >
                            Cancelar Crédito Completo (${liquidationSimulation.totalPayoff.toLocaleString("es-CO")})
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        disabled={loading}
                        onClick={handleOpenPartialPayment}
                        sx={{ py: 1 }}
                    >
                        Abonar otro valor
                    </Button>

                    <Button
                        variant="outlined"
                        color="warning"
                        size="large"
                        disabled={loading || attemptLoading}
                        onClick={() => setAttemptDialogOpen(true)}
                        sx={{ py: 1 }}
                    >
                        Registrar Intento de Cobro
                    </Button>

                    <Button
                        variant="text"
                        color="primary"
                        fullWidth
                        onClick={handleNavigateToDebt}
                        sx={{ mt: 0.5 }}
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
                                installments={installmentsOfDebt}
                                context="collector"
                                totalPaid={installmentsOfDebt.reduce(
                                    (acc, curr) => acc + (curr.amountPaid || 0),
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
        </Box>
    );
};
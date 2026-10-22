import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    Tooltip,
    Box,
    Skeleton,
} from "@mui/material";
import type { Debt, DebtStatus } from "../../features/debits/domain/business/entities/Debt";
import type { DebtPaymentCapacity } from "../../features/debits/domain/business/services/calculateDebtPaymentCapacity";
import { diasPorTermino } from "../../core/helpers/debts/diasPorTermino";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";
import { getDebtVisualStatus } from "../sub_atomic_particles/debtVisualStatus";

export interface DebtTableProps {
    debts: Debt[];
    onClick?: (debt: Debt) => void;
}

export interface DebtTableAccountantProps {
    debts: Debt[];
    onClick?: (debt: Debt) => void;
    capacities?: Record<string, DebtPaymentCapacity>;
    loadingCapacities?: boolean;
}

/* ------------------------------------ */
/* Helpers                              */
/* ------------------------------------ */

const calculateTotalDays = (debt: Debt) => {
    const days = diasPorTermino[debt.debtTerms];
    return days * debt.installmentCount;
};

const calculateInstallmentValue = (debt: Debt) => {
    if (debt.installmentCount === 0) return 0;
    return debt.amount / debt.installmentCount;
};

const debtStatusColorMap: Record<DebtStatus, "default" | "info" | "warning" | "success" | "error"> = {
    tentativa: "default",
    preAprobada: "info",
    preparacion: "warning",
    activa: "success",
    corregir: "warning",
    pagada: "success",
    en_mora: "error",
    negociada: "warning",
    inactivo: "default",
    anulado: "default",
};

/* ------------------------------------ */
/* Component                            */
/* ------------------------------------ */

export default function DebtTable({ debts, onClick }: DebtTableProps) {
    return (
        <TableContainer component={Paper}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Codificación</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Fecha inicio</TableCell>
                        <TableCell>Capital</TableCell>
                        <TableCell>Interés</TableCell>
                        <TableCell>Modalidad</TableCell>
                        <TableCell>Días totales</TableCell>
                        <TableCell>Valor cuota</TableCell>
                        <TableCell>Próximo pago</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Total pagado</TableCell>
                        <TableCell>Último pago</TableCell>
                        <TableCell>Cuotas pagadas</TableCell>
                        <TableCell>Cuotas pendientes</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {debts.map((debt) => {
                        const installmentValue = calculateInstallmentValue(debt);
                        const totalDays = calculateTotalDays(debt);
                        const pendingInstallments =
                            debt.installmentCount - (debt.installmentsPaid ?? 0);
                        const visualStatus = getDebtVisualStatus(debt);

                        return (
                            <TableRow
                                key={debt.id}
                                hover
                                onClick={() => onClick?.(debt)}
                                sx={{
                                    backgroundColor: debt.status === "pagada" ? "#b0b0b9ff" : "default",
                                    cursor: onClick ? "pointer" : "default",
                                }}
                            >
                                <TableCell>
                                    <Typography fontWeight={600}>{"crdt-" + debt.name}</Typography>
                                </TableCell>

                                <TableCell>{debt.clientName}</TableCell>

                                <TableCell>{formatISOToInputDate(debt.startDate)}</TableCell>

                                <TableCell>{FormatNumberToMoney(debt.capital)}</TableCell>

                                <TableCell>{debt.interestRate}%</TableCell>

                                <TableCell>{debt.debtTerms}</TableCell>

                                <TableCell>{totalDays}</TableCell>

                                <TableCell>{FormatNumberToMoney(installmentValue)}</TableCell>

                                <TableCell>{formatISOToInputDate(debt.nextPaymentDue) || "-"}</TableCell>

                                <TableCell>
                                    <Chip
                                        label={visualStatus === "en_mora" ? "En mora" : debt.status}
                                        size="small"
                                        color={debtStatusColorMap[visualStatus] || "default"}
                                    />
                                </TableCell>

                                <TableCell>{FormatNumberToMoney(debt.amountPaid)}</TableCell>

                                <TableCell>{formatISOToInputDate(debt.dateLastPayment || "") || "-"}</TableCell>

                                <TableCell>
                                    {debt.installmentsPaid ?? 0}/{debt.installmentCount}
                                </TableCell>

                                <TableCell>{pendingInstallments ?? 0}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export function DebtTableAccountant({
    debts,
    onClick,
    capacities,
    loadingCapacities = false,
}: DebtTableAccountantProps) {
    return (
        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Codificación</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Capital</TableCell>
                        <TableCell>Interés</TableCell>
                        <TableCell>Modalidad</TableCell>
                        <TableCell>Días</TableCell>
                        <TableCell>Valor cuota</TableCell>
                        <TableCell>Próximo pago</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Total pagado</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Saldo Base</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main" }}>Mora a hoy</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "warning.dark" }}>Aplazamiento</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Exigible hoy</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main" }}>Total cartera</TableCell>
                        <TableCell>Último pago</TableCell>
                        <TableCell>Cuotas pagadas</TableCell>
                        <TableCell>Cuotas pend.</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {debts.map((debt) => {
                        const installmentValue = calculateInstallmentValue(debt);
                        const totalDays = calculateTotalDays(debt);
                        const pendingInstallments =
                            debt.installmentCount - (debt.installmentsPaid ?? 0);
                        const visualStatus = getDebtVisualStatus(debt);

                        const capacity = capacities ? capacities[debt.id] : undefined;
                        const remainingBase = Math.max(0, debt.amount - debt.amountPaid);
                        const arrears = capacity?.dueTodayArrears ?? 0;
                        const deferment = capacity?.dueTodayDeferment ?? 0;
                        const dueToday = capacity?.dueTodayTotal ?? 0;
                        const totalPayable = capacity
                            ? remainingBase + arrears + deferment
                            : remainingBase;

                        return (
                            <TableRow
                                key={debt.id}
                                hover
                                onClick={() => onClick?.(debt)}
                                sx={{
                                    cursor: onClick ? "pointer" : "default",
                                    backgroundColor: debt.status === "pagada" ? "#f5f5f5" : "inherit",
                                }}
                            >
                                <TableCell>
                                    <Typography fontWeight={600} variant="body2">
                                        {"crdt-" + debt.name}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {debt.clientName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {debt.clientDocument}
                                    </Typography>
                                </TableCell>

                                <TableCell>{FormatNumberToMoney(debt.capital)}</TableCell>

                                <TableCell>{debt.interestRate}%</TableCell>

                                <TableCell>{debt.debtTerms}</TableCell>

                                <TableCell>{totalDays}</TableCell>

                                <TableCell>{FormatNumberToMoney(installmentValue)}</TableCell>

                                <TableCell>{formatISOToInputDate(debt.nextPaymentDue) || "-"}</TableCell>

                                <TableCell>
                                    <Chip
                                        label={visualStatus === "en_mora" ? "En mora" : debt.status}
                                        size="small"
                                        color={debtStatusColorMap[visualStatus] || "default"}
                                        variant="outlined"
                                    />
                                </TableCell>

                                <TableCell align="right">
                                    <Typography variant="body2" color="success.main" fontWeight={600}>
                                        {FormatNumberToMoney(debt.amountPaid)}
                                    </Typography>
                                </TableCell>

                                {/* Saldo Base: Capital + Interés restante contractual */}
                                <TableCell align="right">
                                    <Tooltip title="Saldo restante base del crédito (Capital + Interés acordado)" arrow>
                                        <Typography variant="body2" fontWeight={600}>
                                            {FormatNumberToMoney(remainingBase)}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>

                                {/* Mora a hoy: Interés por retraso devengado dinámicamente hasta hoy */}
                                <TableCell align="right">
                                    {capacity ? (
                                        arrears > 0 ? (
                                            <Tooltip title={`Mora acumulada por cuotas vencidas devengada hasta hoy`} arrow>
                                                <Box display="flex" flexDirection="column" alignItems="flex-end">
                                                    <Typography variant="body2" fontWeight={700} color="error.main">
                                                        {FormatNumberToMoney(arrears)}
                                                    </Typography>
                                                    {capacity.overdueInstallmentsCount > 0 && (
                                                        <Chip
                                                            label={`${capacity.overdueInstallmentsCount} cuotas`}
                                                            size="small"
                                                            color="error"
                                                            sx={{ height: 16, fontSize: "0.6rem" }}
                                                        />
                                                    )}
                                                </Box>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                $0
                                            </Typography>
                                        )
                                    ) : loadingCapacities ? (
                                        <Skeleton variant="text" width={50} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                </TableCell>

                                {/* Aplazamiento a hoy */}
                                <TableCell align="right">
                                    {capacity ? (
                                        deferment > 0 ? (
                                            <Tooltip title={`Valor por conceptos de aplazamiento diferidos pendientes`} arrow>
                                                <Typography variant="body2" fontWeight={700} color="warning.dark">
                                                    {FormatNumberToMoney(deferment)}
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                $0
                                            </Typography>
                                        )
                                    ) : loadingCapacities ? (
                                        <Skeleton variant="text" width={50} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                </TableCell>

                                {/* Exigible a hoy: Total para quedar al día */}
                                <TableCell align="right">
                                    {capacity ? (
                                        <Tooltip
                                            title={`Cuotas vencidas: ${FormatNumberToMoney(capacity.dueTodayBaseAmount)} + Mora: ${FormatNumberToMoney(arrears)} + Aplazamiento: ${FormatNumberToMoney(deferment)}`}
                                            arrow
                                        >
                                            <Box display="flex" flexDirection="column" alignItems="flex-end">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                    color={dueToday > 0 ? "error.main" : "text.secondary"}
                                                >
                                                    {FormatNumberToMoney(dueToday)}
                                                </Typography>
                                                {dueToday > 0 && (
                                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "text.secondary" }}>
                                                        Al día hoy
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Tooltip>
                                    ) : loadingCapacities ? (
                                        <Skeleton variant="text" width={60} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                </TableCell>

                                {/* Total Cartera: Saldo Base + Mora Hoy + Aplazamiento Hoy */}
                                <TableCell align="right">
                                    {capacity ? (
                                        <Tooltip
                                            title={`Total cartera: Saldo base (${FormatNumberToMoney(remainingBase)}) + Mora hoy (${FormatNumberToMoney(arrears)}) + Aplazamiento (${FormatNumberToMoney(deferment)})`}
                                            arrow
                                        >
                                            <Typography variant="body2" fontWeight={700} color="primary.main">
                                                {FormatNumberToMoney(totalPayable)}
                                            </Typography>
                                        </Tooltip>
                                    ) : loadingCapacities ? (
                                        <Skeleton variant="text" width={65} />
                                    ) : (
                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                            {FormatNumberToMoney(remainingBase)}
                                        </Typography>
                                    )}
                                </TableCell>

                                <TableCell>{formatISOToInputDate(debt.dateLastPayment || "") || "-"}</TableCell>

                                <TableCell>
                                    {debt.installmentsPaid ?? 0}/{debt.installmentCount}
                                </TableCell>

                                <TableCell>{pendingInstallments ?? 0}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
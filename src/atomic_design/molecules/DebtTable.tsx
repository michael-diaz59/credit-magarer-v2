import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from "@mui/material";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import { diasPorTermino } from "../../core/helpers/debts/diasPorTermino";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";



interface Props {
    debts: Debt[];
    onClick?: (debt: Debt) => void;
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



/* ------------------------------------ */
/* Component                            */
/* ------------------------------------ */

export default function DebtTable({ debts, onClick }: Props) {
    console.log("debts", debts);
    return (
        <TableContainer component={Paper}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>codificacion</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>fecha inicio</TableCell>
                        <TableCell>Capital</TableCell>
                        <TableCell>Interés</TableCell>
                        <TableCell>modalidad</TableCell>
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

                        return (
                            <TableRow key={debt.id} hover onClick={() => onClick?.(debt)} sx={{ backgroundColor: debt.status === "pagada" ? "#b0b0b9ff" : "default" }}>
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

                                <TableCell>{debt.status}</TableCell>

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

export function DebtTableAccountant({ debts, onClick }: Props) {
    console.log("debts", debts);
    return (
        <TableContainer component={Paper}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>codificacion</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Capital</TableCell>
                        <TableCell>Interés</TableCell>
                        <TableCell>modalidad</TableCell>
                        <TableCell>Días totales</TableCell>
                        <TableCell>Valor cuota</TableCell>
                        <TableCell>Próximo pago</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Total pagado</TableCell>
                        <TableCell>Total por pagar</TableCell>
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

                        return (
                            <TableRow key={debt.id} hover onClick={() => onClick?.(debt)}>
                                <TableCell>
                                    <Typography fontWeight={600}>{"crdt-" + debt.name}</Typography>
                                </TableCell>

                                <TableCell>{debt.clientName}</TableCell>

                                <TableCell>{FormatNumberToMoney(debt.capital)}</TableCell>

                                <TableCell>{debt.interestRate}%</TableCell>

                                <TableCell>{debt.debtTerms}</TableCell>

                                <TableCell>{totalDays}</TableCell>

                                <TableCell>{FormatNumberToMoney(installmentValue)}</TableCell>

                                <TableCell>{formatISOToInputDate(debt.nextPaymentDue) || "-"}</TableCell>

                                <TableCell>{debt.status}</TableCell>

                                <TableCell>{FormatNumberToMoney(debt.amountPaid)}</TableCell>
                                <TableCell>{FormatNumberToMoney(debt.amount - debt.amountPaid)}</TableCell>

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
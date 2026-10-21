import { useMemo } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
} from "@mui/material";

import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import type { DebtGroupData } from "../../features/collector/helpers/groupInstallmentsByRoute";
import { calculateInstallmentArrears } from "../../features/debits/domain/business/services/calculateInstallmentArrears";
import { CustomerAccordionHeader } from "../atoms/CustomerAccordionHeader";
import { DebtAccordion } from "./DebtAccordion";

export interface CustomerAccordionProps {
    customerName: string;
    pending: Installment[];
    overdue: Installment[];
    debts?: Map<string, DebtGroupData> | DebtGroupData[];
    debtNames?: Record<string, string>;
    debtsById?: Record<string, Debt>;
    expanded: boolean;
    isCollectedView?: boolean;
    onChange: (isExpanded: boolean) => void;
    onClick: (installment: Installment) => void;
}

export const CustomerAccordion = ({
    customerName,
    pending,
    overdue,
    debts,
    debtNames,
    debtsById,
    expanded,
    isCollectedView = false,
    onChange,
    onClick,
}: CustomerAccordionProps) => {
    const totalCount = pending.length + overdue.length;
    const overdueCount = overdue.length;

    const totalPendingAmount = useMemo(() => {
        return [...pending, ...overdue].reduce((sum, curr) => {
            if (isCollectedView) {
                return sum + (curr.totalPaid ?? curr.amountPaid ?? curr.amount ?? 0);
            }
            const basePending = curr.outstandingReceivablesAmount ?? curr.amount ?? 0;
            const debt = curr.debtId ? debtsById?.[curr.debtId] : undefined;
            const arrearsInfo = calculateInstallmentArrears({ installment: curr, debt });
            return sum + basePending + arrearsInfo.totalPendingArrears;
        }, 0);
    }, [pending, overdue, isCollectedView, debtsById]);

    const debtList = useMemo<DebtGroupData[]>(() => {
        if (debts) {
            return Array.isArray(debts) ? debts : Array.from(debts.values());
        }

        // Si no vienen agrupados previamente por crédito, los agrupamos aquí
        const map = new Map<string, DebtGroupData>();
        const allItems = [...pending, ...overdue];

        for (const item of allItems) {
            const debtId = item.debtId || "sin_credito";
            if (!map.has(debtId)) {
                const resolvedName =
                    debtNames?.[debtId] ||
                    item.debtName ||
                    (item.debtId ? `Crédito #${item.debtId.slice(-4).toUpperCase()}` : "Crédito");

                map.set(debtId, {
                    debtId,
                    debtName: resolvedName,
                    debt: debtsById?.[debtId],
                    pending: [],
                    overdue: [],
                });
            }

            const debtGroup = map.get(debtId)!;
            if (overdue.some((o) => o.id === item.id)) {
                debtGroup.overdue.push(item);
            } else {
                debtGroup.pending.push(item);
            }
        }

        return Array.from(map.values());
    }, [debts, pending, overdue, debtNames, debtsById]);

    return (
        <Accordion
            expanded={expanded}
            onChange={(_, isExpanded) => onChange(isExpanded)}
            disableGutters
            elevation={0}
            sx={{
                mb: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px !important",
                "&:before": { display: "none" },
                overflow: "hidden",
            }}
        >
            <AccordionSummary
                expandIcon={<span>▼</span>}
                aria-controls={`${customerName}-content`}
                id={`${customerName}-header`}
                sx={{
                    backgroundColor: "background.paper",
                    minHeight: 48,
                    "&.Mui-expanded": { minHeight: 48 },
                }}
            >
                <CustomerAccordionHeader
                    customerName={customerName}
                    totalCount={totalCount}
                    overdueCount={overdueCount}
                    totalPendingAmount={totalPendingAmount}
                    isCollectedView={isCollectedView}
                />
            </AccordionSummary>

            <AccordionDetails sx={{ p: 1.5, pt: 1, backgroundColor: "action.hover" }}>
                {debtList.map((debt) => (
                    <DebtAccordion
                        key={debt.debtId}
                        debtId={debt.debtId}
                        debtName={debt.debtName}
                        debt={debt.debt || (debt.debtId ? debtsById?.[debt.debtId] : undefined)}
                        pending={debt.pending}
                        overdue={debt.overdue}
                        isCollectedView={isCollectedView}
                        onClick={onClick}
                    />
                ))}

                {debtList.length === 0 && (
                    <CustomerAccordionHeader
                        customerName="Sin cuotas activas"
                        totalCount={0}
                        overdueCount={0}
                    />
                )}
            </AccordionDetails>
        </Accordion>
    );
};
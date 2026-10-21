import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from "@mui/material";
import { CustomerAccordion } from "./CustomerAccordion";
import { useState } from "react";
import type { CustomerGroupData } from "../../features/collector/helpers/groupInstallmentsByRoute";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import { calculateInstallmentArrears } from "../../features/debits/domain/business/services/calculateInstallmentArrears";

interface RouteGroupProps {
    routeName: string;
    customers: Map<string, CustomerGroupData>;
    debtsById?: Record<string, Debt>;
    expanded: boolean;
    onChange: (isExpanded: boolean) => void;
    onClick: (installment: Installment) => void;
}

export const RouteGroup = ({
    routeName,
    customers,
    debtsById,
    expanded,
    onChange,
    onClick,
}: RouteGroupProps) => {
    const [expandedCustomers, setExpandedCustomers] = useState<Map<string, boolean>>(new Map());

    const toggleCustomer = (customerId: string, isExpanded: boolean) => {
        const newExpanded = new Map(expandedCustomers);
        newExpanded.set(customerId, isExpanded);
        setExpandedCustomers(newExpanded);
    };

    let totalInstallments = 0;
    let overdueInstallments = 0;
    let totalRoutePendingAmount = 0;

    customers.forEach(customer => {
        totalInstallments += customer.pending.length + customer.overdue.length;
        overdueInstallments += customer.overdue.length;
        const allItems = [...customer.pending, ...customer.overdue];
        allItems.forEach(i => {
            const basePending = i.outstandingReceivablesAmount ?? i.amount ?? 0;
            const debt = i.debtId ? debtsById?.[i.debtId] : undefined;
            const arrearsInfo = calculateInstallmentArrears({ installment: i, debt });
            totalRoutePendingAmount += basePending + arrearsInfo.totalPendingArrears;
        });
    });

    return (
        <Accordion
            expanded={expanded}
            onChange={(_, isExpanded) => onChange(isExpanded)}
            disableGutters
            elevation={1}
            sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden'
            }}
        >
            <AccordionSummary
                expandIcon={<span>▼</span>}
                aria-controls={`${routeName}-content`}
                id={`${routeName}-header`}
                sx={{ backgroundColor: 'action.hover' }}
            >
                <Box display="flex" alignItems="center" width="100%" justifyContent="space-between" mr={2}>
                    <Box display="flex" flexDirection="column">
                        <Typography fontWeight="bold" variant="h6">{routeName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Por cobrar: ${totalRoutePendingAmount.toLocaleString("es-CO")} • {totalInstallments} cuota{totalInstallments !== 1 ? 's' : ''}
                        </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                        {overdueInstallments > 0 && <Chip label={`${overdueInstallments} vencidas`} color="error" size="small" />}
                        <Chip label={`${customers.size} cliente${customers.size !== 1 ? 's' : ''}`} size="small" />
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, backgroundColor: 'action.selected' }}>
                {Array.from(customers.entries()).map(([customerId, data]) => (
                    <CustomerAccordion
                        key={customerId}
                        customerName={data.customerName}
                        pending={data.pending}
                        overdue={data.overdue}
                        debts={data.debts}
                        debtsById={debtsById}
                        expanded={expandedCustomers.get(customerId) ?? true}
                        onChange={(isExpanded) => toggleCustomer(customerId, isExpanded)}
                        onClick={onClick}
                    />
                ))}

                {customers.size === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" py={2}>
                        No hay clientes asignados a esta ruta actualmente.
                    </Typography>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

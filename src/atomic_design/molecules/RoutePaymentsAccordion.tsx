import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Stack,
    Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { Payment } from "../../features/debits/domain/business/entities/Payment";
import { PaymentItem } from "../atoms/PaymentItem";
import type { Route } from "../../features/routes/domain/business/entities/Route";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";

type RoutePaymentsAccordionProps = {
    route: Route;
    payments: Payment[];
    selectedIds: string[];
    onTogglePayment: (paymentId: string) => void;
    onCardClick: (payment: Payment) => void;
};

export const RoutePaymentsAccordion = ({
    route,
    payments,
    selectedIds,
    onTogglePayment,
    onCardClick,
}: RoutePaymentsAccordionProps) => {

    return (
        <Accordion defaultExpanded={payments.length > 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                    pr={2}
                >
                    <Typography fontWeight="bold">
                        {route.id === "default" ? "Registros sin ruta" : route.name}
                    </Typography>

                    <Typography color="primary" fontWeight="bold">
                        {FormatNumberToMoney(route.totalCash || 0)}
                    </Typography>
                </Box>
            </AccordionSummary>

            <AccordionDetails>
                {payments.length === 0 ? (
                    <Typography color="text.secondary">
                        No hay pagos registrados en esta ruta.
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {payments.map((payment) => {
                            const checked = selectedIds.includes(payment.id);

                            return (
                                <PaymentItem
                                    key={payment.id}
                                    payment={payment}
                                    checked={checked}
                                    toggleSelection={onTogglePayment}
                                    handleCardClick={onCardClick}
                                />
                            );
                        })}
                    </Stack>
                )}
            </AccordionDetails>
        </Accordion>
    );
};
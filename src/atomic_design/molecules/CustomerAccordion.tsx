import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Divider, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { SectionInstallments } from "./SectionInstallments";

interface CustomerAccordionProps {
    customerName: string;
    pending: Installment[];
    overdue: Installment[];
    expanded: boolean;
    onChange: (isExpanded: boolean) => void;
    onClick: (installment: Installment) => void;
}

export const CustomerAccordion = ({
    customerName,
    pending,
    overdue,
    expanded,
    onChange,
    onClick,
}: CustomerAccordionProps) => {
    const totalCount = pending.length + overdue.length;
    const overdueCount = overdue.length;

    return (
        <Accordion
            expanded={expanded}
            onChange={(_, isExpanded) => onChange(isExpanded)}
            disableGutters
            elevation={0}
            sx={{
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                overflow: 'hidden'
            }}
        >
            <AccordionSummary
                expandIcon={<span>▼</span>}
                aria-controls={`${customerName}-content`}
                id={`${customerName}-header`}
                sx={{
                    backgroundColor: 'background.paper',
                    minHeight: 48,
                    '&.Mui-expanded': { minHeight: 48 }
                }}
            >
                <Box display="flex" alignItems="center" width="100%" justifyContent="space-between" mr={2}>
                    <Typography fontWeight="500" variant="body1">{customerName}</Typography>

                    <Box display="flex" gap={1}>
                        {overdueCount > 0 && <Chip label={`${overdueCount} mora`} color="error" size="small" variant="outlined" />}
                        <Chip label={`${totalCount} deuda${totalCount > 1 ? 's' : ''}`} size="small" />
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, pt: 0 }}>
                {overdue.length > 0 && (
                    <Box mt={1}>
                        <SectionInstallments
                            title="Cuotas en mora"
                            color="error"
                            installments={overdue}
                            onClick={onClick}
                        />
                    </Box>
                )}

                {overdue.length > 0 && pending.length > 0 && <Divider sx={{ my: 2 }} />}

                {pending.length > 0 && (
                    <Box mt={overdue.length > 0 ? 0 : 1}>
                        <SectionInstallments
                            title="Cuotas pendientes"
                            color="warning"
                            installments={pending}
                            onClick={onClick}
                        />
                    </Box>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

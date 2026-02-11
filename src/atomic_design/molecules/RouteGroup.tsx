import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Divider, Typography } from "@mui/material";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Asegurarse de tener iconos o usar texto
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { SectionInstallments } from "./SectionInstallments";

interface RouteGroupProps {
    routeName: string;
    pending: Installment[];
    overdue: Installment[];
    expanded: boolean;
    onChange: (isExpanded: boolean) => void;
    onClick: (installment: Installment) => void;
}

export const RouteGroup = ({
    routeName,
    pending,
    overdue,
    expanded,
    onChange,
    onClick,
}: RouteGroupProps) => {
    const totalCount = pending.length + overdue.length;
    const overdueCount = overdue.length;

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
                '&:before': { display: 'none' }
            }}
        >
            <AccordionSummary
                // expandIcon={<ExpandMoreIcon />} // Si no hay iconos configurados, omitimos por ahora o usamos Unicode
                expandIcon={<span>▼</span>}
                aria-controls={`${routeName}-content`}
                id={`${routeName}-header`}
                sx={{ backgroundColor: 'action.hover' }}
            >
                <Box display="flex" alignItems="center" width="100%" justifyContent="space-between" mr={2}>
                    <Typography fontWeight="bold">{routeName}</Typography>

                    <Box display="flex" gap={1}>
                        {overdueCount > 0 && <Chip label={`${overdueCount} vencidas`} color="error" size="small" />}
                        <Chip label={`${totalCount} total`} size="small" />
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
                {overdue.length > 0 && (
                    <>
                        <SectionInstallments
                            title="Vencidas"
                            color="error"
                            installments={overdue}
                            onClick={onClick}
                        />
                        {pending.length > 0 && <Divider sx={{ my: 2 }} />}
                    </>
                )}

                {pending.length > 0 && (
                    <SectionInstallments
                        title="Pendientes"
                        color="warning"
                        installments={pending}
                        onClick={onClick}
                    />
                )}

                {totalCount === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" py={2}>
                        No hay cuotas asignadas a esta ruta actualmente.
                    </Typography>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

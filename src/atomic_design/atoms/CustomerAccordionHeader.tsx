import { Box, Chip, Typography } from "@mui/material";

interface CustomerAccordionHeaderProps {
    customerName: string;
    totalCount: number;
    overdueCount: number;
    totalPendingAmount?: number;
    isCollectedView?: boolean;
}

export const CustomerAccordionHeader = ({
    customerName,
    totalCount,
    overdueCount,
    totalPendingAmount,
    isCollectedView = false,
}: CustomerAccordionHeaderProps) => {
    const pendingCount = totalCount - overdueCount;

    return (
        <Box
            display="flex"
            alignItems="center"
            width="100%"
            justifyContent="space-between"
            mr={2}
        >
            <Box display="flex" flexDirection="column">
                <Typography fontWeight="500" variant="body1">
                    {customerName}
                </Typography>
                {totalPendingAmount !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                        {isCollectedView ? "Total pagado" : "Por cobrar"}: ${totalPendingAmount.toLocaleString("es-CO")}
                    </Typography>
                )}
            </Box>

            <Box display="flex" gap={1}>
                {isCollectedView ? (
                    <Chip
                        label={`${totalCount} pagada${totalCount > 1 ? "s" : ""}`}
                        color="success"
                        size="small"
                        variant="outlined"
                    />
                ) : (
                    <>
                        {overdueCount > 0 && (
                            <Chip
                                label={`${overdueCount} mora`}
                                color="error"
                                size="small"
                                variant="outlined"
                            />
                        )}

                        {pendingCount > 0 && (
                            <Chip
                                label={`${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`}
                                size="small"
                            />
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};
import { Box, Chip, Typography } from "@mui/material";

interface CustomerAccordionHeaderProps {
    customerName: string;
    totalCount: number;
    overdueCount: number;
}

export const CustomerAccordionHeader = ({
    customerName,
    totalCount,
    overdueCount,
}: CustomerAccordionHeaderProps) => {
    return (
        <Box
            display="flex"
            alignItems="center"
            width="100%"
            justifyContent="space-between"
            mr={2}
        >
            <Typography fontWeight="500" variant="body1">
                {customerName}
            </Typography>

            <Box display="flex" gap={1}>
                {overdueCount > 0 && (
                    <Chip
                        label={`${overdueCount} mora`}
                        color="error"
                        size="small"
                        variant="outlined"
                    />
                )}

                <Chip
                    label={`${totalCount - overdueCount} pendiente${(totalCount - overdueCount) > 1 ? "s" : ""}`}
                    size="small"
                />
            </Box>
        </Box>
    );
};
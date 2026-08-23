import { Card, Typography, Box } from "@mui/material";
import type { Payment } from "../../features/debits/domain/business/entities/Payment";
import { useTheme } from "@mui/material/styles";
import { Checkbox, CardActionArea } from "@mui/material";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";

export const PaymentItem = ({ payment, checked, toggleSelection, handleCardClick }: { payment: Payment, checked: boolean, toggleSelection: (id: string) => void, handleCardClick: (payment: Payment) => void }) => {

    const theme = useTheme();

    return (
        <Card
            key={payment.id}
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center",
                transition: "0.2s",
                border: checked
                    ? `2px solid ${theme.palette.primary.main}`
                    : undefined,
            }}
        >
            <Box p={1} minWidth={58} display="flex" justifyContent="center">
                {payment.isTight ? (
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: "bold",
                            color: "success.main",
                            textTransform: "uppercase",
                            fontSize: "0.65rem",
                            border: (theme) => `1px solid ${theme.palette.success.main}`,
                            padding: "2px 4px",
                            borderRadius: "4px",
                        }}
                    >
                        Cuadrado
                    </Typography>
                ) : (
                    <Checkbox
                        checked={checked}
                        onChange={() => toggleSelection(payment.id)}
                    />
                )}
            </Box>

            <CardActionArea
                onClick={() => handleCardClick(payment)}
                sx={{ flexGrow: 1, padding: 2 }}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Cliente: {payment.clientName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Cobrador: {payment.collectorName}
                        </Typography>
                    </Box>

                    <Box textAlign="right">
                        <Typography
                            variant="h6"
                            color="primary"
                            fontWeight="bold"
                        >
                            {FormatNumberToMoney(payment.amount)}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {payment.method}
                        </Typography>
                    </Box>
                </Box>
            </CardActionArea>
        </Card>
    );
};
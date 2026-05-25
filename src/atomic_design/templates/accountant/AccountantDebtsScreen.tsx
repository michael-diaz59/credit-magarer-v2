import { Box, Typography, Container, Alert } from "@mui/material";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { useFirestorePagination } from "../../../features/debits/provider/firebase/useFirestorePagination";
//import { ScreenPaths } from "../../../core/helpers/name_routes";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import { DebtListAccountant } from "../../molecules/DebtList";
import { CustomSx } from "../../sub_atomic_particles/Custom_sx";


//se modifica temporalmente para cargar todos los creditos
export function AccountantDebtsScreen() {
    const companyId = useAppSelector((state) => state.user.user?.companyId);

    console.log("companyId", companyId);


    const {
        data: debts,
        loading,
        loadMore,
        hasMore
    } = useFirestorePagination({
        path: `companies/${companyId}/debts`,
        pageSize: 15,
        orderBy: [
            { field: "startDate", direction: "desc" },
        ],

        filters: [
            { field: "deliveredStatus", op: "==", value: "entregado" }]

    });

    const handleDebtClick = (_debt: Debt) => {
        // Navigate to the list of debts for the specific customer that the accountant can audit
        //navigate(ScreenPaths.accountant.debitsCustomer(debt.costumerDocument));
    };

    if (!companyId) return null;

    return (
        <Container sx={{ py: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                <AccountBalanceIcon color="primary" fontSize="large" />
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Creditos desembolsados de la Empresa
                </Typography>
            </Box>

            <Box sx={{
                backgroundColor: "background.paper",
                borderRadius: CustomSx.basic.borderRadius.circularBorder,
                p: 3,
                boxShadow: 2
            }}>
                {debts.length === 0 && !loading ? (
                    <Alert severity="info">No hay creditos registrados como entregados en el sistema</Alert>
                ) : (
                    <DebtListAccountant
                        debts={debts}
                        loadMore={loadMore}
                        hasMore={hasMore}
                        loading={loading}
                        onClick={handleDebtClick}
                    />
                )}
            </Box>
        </Container>
    );
}

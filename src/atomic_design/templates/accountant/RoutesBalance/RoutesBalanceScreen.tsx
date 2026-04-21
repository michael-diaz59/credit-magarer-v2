import { useRoutesBalance } from "./useRoutesBalance";
import { RoutesBalanceView } from "./RoutesBalanceView";

export const RoutesBalanceScreen = () => {
    const {
        routes,
        bankAccounts,
        collectors,
        isLoading,
        globalTotal,
        globalChartData,
        totalCashSystem,
        bankAccountTotals,
    } = useRoutesBalance();

    return (
        <RoutesBalanceView
            routes={routes}
            bankAccounts={bankAccounts}
            collectors={collectors}
            isLoading={isLoading}
            globalTotal={globalTotal}
            globalChartData={globalChartData}
            totalCashSystem={totalCashSystem}
            bankAccountTotals={bankAccountTotals}
        />
    );
};

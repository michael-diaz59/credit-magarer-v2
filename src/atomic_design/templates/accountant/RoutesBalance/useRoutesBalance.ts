import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { routeOrchestrator } from "../../../../features/routes/domain/infraestructure/RouteOrchestrator";
import type { Route } from "../../../../features/routes/domain/business/entities/Route";
import BankAccountOrchestrator from "../../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import { useAppDispatch } from "../../../../store/redux/coreRedux";
import type { User } from "../../../../features/users/domain/business/entities/User";

export const useRoutesBalance = () => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [collectors, setCollectors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useAppDispatch();
    const companyId = useAppSelector((state: any) => state.user.user?.companyId) || "";

    const fetchRoutes = async () => {
        if (!companyId) return;
        setIsLoading(true);
        const bankOrchestrator = new BankAccountOrchestrator();
        const userOrchestrator = new UserOrchestrator(dispatch);

        const [routeResult, bankResult, userResult] = await Promise.all([
            routeOrchestrator.getRoutesUseCase.execute({ companyId }),
            bankOrchestrator.getAll({ companyId }),
            userOrchestrator.getUsersByCompany({ id: companyId, rol: "COLLECTOR" })
        ]);

        if (routeResult.ok) {
            console.log("routeResult", routeResult.value);
            setRoutes(routeResult.value);
        }

        if (bankResult.ok) {
            setBankAccounts(bankResult.value.bankAccounts);
        }

        console.log("userResult", userResult?.state);

        if (userResult.state.ok) {
            setCollectors(userResult.state.value);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchRoutes();
    }, [companyId]);

    const globalTotal = useMemo(() => {
        return routes.reduce((acc, route) => {
            const cash = (route.totalCash2 || []).reduce((sum, c) => sum + c.amount, 0);
            const deposit = (route.totalDeposit || []).reduce((sum, d) => sum + d.amount, 0);
            return acc + cash + deposit;
        }, 0);
    }, [routes]);

    const globalChartData = useMemo(() => {
        return routes
            .map(route => {
                const total = (route.totalCash2 || []).reduce((sum, c) => sum + (c.amount || 0), 0) +
                    (route.totalDeposit || []).reduce((sum, d) => sum + (d.amount || 0), 0);
                return {
                    id: route.id,
                    label: route.name || "Sin Nombre",
                    value: total
                };
            })
            .filter(item => item.value > 0);
    }, [routes]);

    const totalCashSystem = useMemo(() => {
        return routes.reduce((acc, route) => {
            return acc + (route.totalCash2 || []).reduce((sum, c) => sum + c.amount, 0);
        }, 0);
    }, [routes]);

    const bankAccountTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const route of routes) {
            for (const deposit of (route.totalDeposit || [])) {
                totals[deposit.bankAccountId] = (totals[deposit.bankAccountId] || 0) + deposit.amount;
            }
        }
        return totals;
    }, [routes]);

    return {
        routes,
        bankAccounts,
        collectors,
        isLoading,
        globalTotal,
        globalChartData,
        totalCashSystem,
        bankAccountTotals,
    };
};

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/redux/coreRedux";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import type { User } from "../../../../features/users/domain/business/entities/User";

type Props = {
    children: (data: {
        collectors: User[];
        loading: boolean;
    }) => React.ReactNode;
};

export const RenewalDebtFormDataProvider = ({ children }: Props) => {
    const dispatch = useAppDispatch();
    const companyId = useAppSelector(
        (state) => state.user.user?.companyId ?? ""
    );

    const [collectors, setCollectors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;

        const loadCollectors = async () => {
            setLoading(true);

            const orchestrator = new UserOrchestrator(dispatch);

            const result = await orchestrator.getUsersByCompany({
                id: companyId,
                rol: "COLLECTOR",
            });

            if (result.state.ok) {
                setCollectors(result.state.value);
            }

            setLoading(false);
        };

        loadCollectors().catch((error) => {
            console.error("Error cargando cobradores en renovación", error);
            setLoading(false);
        });
    }, [dispatch, companyId]);

    return <>{children({ collectors, loading })}</>;
};

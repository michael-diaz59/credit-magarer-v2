import { useEffect, useState } from "react";
import type { User } from "../../../features/users/domain/business/entities/User";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";

type Props = {
    getUsers?: boolean;
    children: (data: {
        users: User[];
        loading: boolean;
    }) => React.ReactNode;
};

export const VisitFormDataProvider = ({ children, getUsers: getUsers = true }: Props) => {
    const dispatch = useAppDispatch();
    const companyId = useAppSelector(
        (state) => state.user.user?.companyId ?? ""
    );

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;
        if (!getUsers) {
            setLoading(false);
            return;
        };

        const loadCollectors = async () => {
            setLoading(true);

            const orchestrator = new UserOrchestrator(dispatch);

            const result = await orchestrator.getUsersByCompany({
                id: companyId,
                rol: "FIELD_ADVISOR",
            });

            if (result.state.ok && result.state.value) {
                setUsers(result.state.value);
            }

            setLoading(false);
        };

        loadCollectors().catch((error) => {
            console.error("Error cargando rutas", error);
            setLoading(false);
        });
    }, [dispatch, companyId]);

    return <>{children({ users, loading })}</>;
};
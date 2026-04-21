import { useFirestorePagination } from "../../../../features/debits/provider/firebase/useFirestorePagination";
import { DebtList } from "../../../molecules/DebtList";
import { useAppSelector } from "../../../../store/redux/coreRedux";


export function DebtsScreen() {
    const companyId = useAppSelector((state) => state.user.user?.companyId);
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
            { field: "id", direction: "desc" } // 🔥 evita duplicados
        ],
    });

    return (
        <div className="p-4">
            <h1 className="text-h1 mb-4">Deudas</h1>

            <DebtList
                debts={debts}
                loadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
            />
        </div>
    );
}
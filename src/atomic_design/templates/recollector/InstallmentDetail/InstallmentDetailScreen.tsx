import { useParams } from "react-router";
import { UseInstallmentDetail } from "./UseInstallmentDetail";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { InstallmentDetailView } from "./InstallmentDetailView";

export const InstallmentDetailScreen = () => {
    const { id: installmentId } = useParams<{ id: string }>();

    const user = useAppSelector((state) => state.user.user);

    const companyId = user?.companyId ?? "";
    const collectorId = user?.id ?? "";

    const detail = UseInstallmentDetail({
        installmentId,
        companyId,
        collectorId,
    });

    return <InstallmentDetailView {...detail} />;
};
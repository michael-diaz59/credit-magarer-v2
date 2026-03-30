import { Button } from "@mui/material";
import {
    type Debt
} from "../../../features/debits/domain/business/entities/Debt";
import type { DebtFormMode } from "./DebtFormMode";
import { DebtForm, mapDebtToForm, type DebtFormConfig, type DebtFormRef } from "./debtForm2";
import { useRef } from "react";
import { debtComparisonConfig } from "../../sub_atomic_particles/debFormConsts";
import { DebtFormDataProvider } from "./debts/DebtFormDataProvider";

export type DebtFormAction = "create" | "update" | "preApprove";

export type RenewalComparisonFormProps = {
    originalDebt: Debt;
    proposedDebt: Debt;
    mode: DebtFormMode;
    onSubmit: (action: DebtFormAction, data: Debt) => void;
};


/**pantalla para comparar la deuda original con la propuesta */
export const RenewalComparisonForm = ({
    originalDebt,
    proposedDebt,
    onSubmit,
}: RenewalComparisonFormProps) => {
    const debtConfig: DebtFormConfig = debtComparisonConfig

    const formRef = useRef<DebtFormRef>(null);

    const handleApprove = async () => {
        const valid = await formRef.current?.validate();
        if (!valid) return;

        const values = formRef.current?.getValues();

        onSubmit("update", {
            ...proposedDebt,
            ...values,
            status: "activa",
        });
    };

    return (
        <>
            <DebtFormDataProvider getRoutes={true}>
                {({ routes, loading }) => {
                    if (loading) return <div>Cargando...</div>;

                    return (
                        <>
                            <DebtForm
                                ref={formRef}
                                routes={routes}
                                debValues={mapDebtToForm(originalDebt)}
                                renewalProposal={mapDebtToForm(proposedDebt)}
                                config={debtConfig}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleApprove}
                            >
                                Aprobar Renovación
                            </Button>
                        </>
                    )

                }}

            </DebtFormDataProvider>


        </>
    );
};

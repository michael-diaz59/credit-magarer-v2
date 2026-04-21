import type { Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";

export interface ConfirmDebtDeliveryInput {
    companyId: string;
    debtIds: string[];
}

export class ConfirmDebtDeliveryUseCase {
    private debtGateway: DebtGateway;

    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: ConfirmDebtDeliveryInput): Promise<Result<null, any>> {

        return this.debtGateway.confirmDebtsDelivery(input);
    }
}

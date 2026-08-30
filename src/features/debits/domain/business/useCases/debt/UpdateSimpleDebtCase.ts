import { type Result } from "../../../../../../core/helpers/ResultC";
import type {
    DebtGateway,
} from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";

export type UpdateDebtSimpleError =
    | { code: "no hay una ruta asignada" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "WITHOUT_ACTIVE_STATE" }
    | { code: "ERROR_INSTALLMENTS" };

export interface UpdateSimpleDebtInput {
    debt: Debt;
    companyId: string;
    isNewRoute: boolean;
}

export interface UpdateSimpleDebtOutput {
    state: Result<null, UpdateDebtSimpleError>;
}

export class UpdateSimpleDebtCase {
    private debtGateway: DebtGateway;

    constructor(
        debtGateway: DebtGateway,
    ) {
        this.debtGateway = debtGateway;
    }

    /** su funcion es actualizar un debt, si el debt tiene un nuevo collector actualiza el collector de sus installments que no esten pagos o cancelados*/
    async execute(input: UpdateSimpleDebtInput): Promise<UpdateSimpleDebtOutput> {
        console.log("startDate:" + input.debt.startDate)
        const result = await this.debtGateway.update(input);

        return { state: result.state };
    }
}



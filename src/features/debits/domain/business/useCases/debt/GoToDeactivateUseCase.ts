import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import type { UpdateSimpleDebtOutput } from "./UpdateSimpleDebtCase";

export interface GoToDeactivateInput {
  debt: Debt;
  companyId: string;
  isNewRoute: boolean;
}

export class GoToDeactivateUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GoToDeactivateInput
  ): Promise<UpdateSimpleDebtOutput> {
    console.log("startDate:" + input.debt.startDate);
    input.debt.status = "inactivo";

    const result = await this.debtGateway.update(input);

    return result;
  }
}

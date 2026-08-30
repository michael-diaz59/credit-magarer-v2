import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import type { UpdateSimpleDebtOutput } from "./UpdateSimpleDebtCase";

export interface GoToActivateInput {
  debt: Debt;
  companyId: string;
  isNewRoute: boolean;
}

export class GoToActivateUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GoToActivateInput
  ): Promise<UpdateSimpleDebtOutput> {
    console.log("startDate:" + input.debt.startDate);
    input.debt.status = "activa";

    const result = await this.debtGateway.update(input);

    return result;
  }
}

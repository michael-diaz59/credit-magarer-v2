import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import type { UpdateSimpleDebtOutput } from "./UpdateSimpleDebtCase";



export interface GoToPreparationInput {
  debt: Debt;
  companyId: string;
  isNewRoute: boolean;
}

export class GoToPreparationUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GoToPreparationInput
  ): Promise<UpdateSimpleDebtOutput> {
    console.log("startDate:" + input.debt.startDate);
    input.debt.status = "preparacion";
    input.debt.deliveredStatus = "true_preparacion";
    input.debt.delivered = false;

    const result = await this.debtGateway.update(input);

    return result;
  }
}

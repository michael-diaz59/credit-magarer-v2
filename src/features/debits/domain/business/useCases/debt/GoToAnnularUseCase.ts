import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import type { UpdateSimpleDebtOutput } from "./UpdateSimpleDebtCase";

export interface GoToAnnularInput {
  debt: Debt;
  companyId: string;
  isNewRoute: boolean;
}

export class GoToAnnularUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GoToAnnularInput
  ): Promise<UpdateSimpleDebtOutput> {
    console.log("startDate:" + input.debt.startDate);
    input.debt.status = "anulado";

    const result = await this.debtGateway.update(input);

    return result;
  }
}

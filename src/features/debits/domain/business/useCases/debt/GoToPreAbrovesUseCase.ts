import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import type { UpdateSimpleDebtOutput } from "./UpdateSimpleDebtCase";

export interface GoToPreAbrovesInput {
  debt: Debt;
  companyId: string;
  isNewRoute: boolean;
}

export class GoToPreAbrovesUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GoToPreAbrovesInput
  ): Promise<UpdateSimpleDebtOutput> {
    console.log("startDate:" + input.debt.startDate);
    input.debt.status = "preAprobada";

    const result = await this.debtGateway.update(input);

    return result;
  }
}

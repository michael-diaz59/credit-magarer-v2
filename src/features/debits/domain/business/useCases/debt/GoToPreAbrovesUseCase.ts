import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";

export interface GoToPreAbrovesInput {
  debtId: string;
  companyId: string;
}

export type UpdateDebtStatusOutput2 = {
  state: Result<null, { code: string }>;
};

export class GoToPreAbrovesUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GoToPreAbrovesInput
  ): Promise<UpdateDebtStatusOutput2> {

    const result = await this.debtGateway.updateStatus({
      companyId: input.companyId,
      idDebt: input.debtId,
      debtStatus: "preAprobada",
    });

    if (!result.ok) {
      return {
        state: fail(result.error),
      }
    }

    return {
      state: ok(null),
    }
  }
}

import type { Result } from "../../../../../../core/helpers/ResultC";
import type { Debt } from "../../entities/Debt";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";

export type GetDebtsByRouteInput = {
  companyId: string;
  routeId: string;
};

export type GetDebtsByRouteOutput = Promise<Result<Debt[], any>>;

export class GetDebtsByRouteUseCase {
  private debtGateway: DebtGateway;
  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(input: GetDebtsByRouteInput): GetDebtsByRouteOutput {
    return this.debtGateway.getDebtsByRoute(input);
  }
}

import type { Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";

export type GetDebtsByIdsError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export interface GetDebtsByIdsInput {
  companyId: string;
  debtIds: string[];
}

export type GetDebtsByIdsOutput = Debt[];

export class GetDebtsByIdsUseCase {
  private readonly debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GetDebtsByIdsInput
  ): Promise<Result<GetDebtsByIdsOutput, GetDebtsByIdsError>> {
    return this.debtGateway.getDebtsByIds(input);
  }
}

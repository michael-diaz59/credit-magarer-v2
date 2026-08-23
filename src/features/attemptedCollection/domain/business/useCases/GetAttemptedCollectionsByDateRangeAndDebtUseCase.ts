import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";
import type { AttemptedCollectionErrors } from "../entities/types";

export interface GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput {
  companyId: string;
  idDebt: string;
  startDate: string; // ISO date string or timestamp depending on how createAt is saved
  endDate: string;
}

export interface GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput {
  attempts: AttemptedCollection[];
}

export default class GetAttemptedCollectionsByDateRangeAndDebtUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionsByDateRangeAndDebt(input);
  }
}

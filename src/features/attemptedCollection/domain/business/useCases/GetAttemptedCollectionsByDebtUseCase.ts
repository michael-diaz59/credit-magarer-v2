import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";


export interface GetAttemptedCollectionsByDebtUseCaseInput {
  companyId: string;
  idDebt: string;
}

export interface GetAttemptedCollectionsByDebtUseCaseOutput {
  attempts: AttemptedCollection[];
}

export default class GetAttemptedCollectionsByDebtUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionsByDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDebtUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionsByDebt(input);
  }
}

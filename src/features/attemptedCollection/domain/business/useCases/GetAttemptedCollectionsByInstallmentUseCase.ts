import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";


export interface GetAttemptedCollectionsByInstallmentUseCaseInput {
  companyId: string;
  idInstallment: string;
}

export interface GetAttemptedCollectionsByInstallmentUseCaseOutput {
  attempts: AttemptedCollection[];
}

export default class GetAttemptedCollectionsByInstallmentUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionsByInstallmentUseCaseInput): Promise<Result<GetAttemptedCollectionsByInstallmentUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionsByInstallment(input);
  }
}

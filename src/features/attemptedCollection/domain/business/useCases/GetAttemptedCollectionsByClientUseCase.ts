import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";

export interface GetAttemptedCollectionsByClientUseCaseInput {
  companyId: string;
  idClient: string;
}

export interface GetAttemptedCollectionsByClientUseCaseOutput {
  attempts: AttemptedCollection[];
}

export default class GetAttemptedCollectionsByClientUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionsByClientUseCaseInput): Promise<Result<GetAttemptedCollectionsByClientUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionsByClient(input);
  }
}

import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";

export interface GetAttemptedCollectionByIdUseCaseInput {
  companyId: string;
  attemptId: string;
}

export interface GetAttemptedCollectionByIdUseCaseOutput {
  attempt: AttemptedCollection | null;
}

export default class GetAttemptedCollectionByIdUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionByIdUseCaseInput): Promise<Result<GetAttemptedCollectionByIdUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionById(input);
  }
}

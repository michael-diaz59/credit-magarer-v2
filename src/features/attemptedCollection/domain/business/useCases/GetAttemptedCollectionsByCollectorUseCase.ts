import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";


export interface GetAttemptedCollectionsByCollectorUseCaseInput {
  companyId: string;
  idCollector: string;
}

export interface GetAttemptedCollectionsByCollectorUseCaseOutput {
  attempts: AttemptedCollection[];
}

export default class GetAttemptedCollectionsByCollectorUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionsByCollectorUseCaseInput): Promise<Result<GetAttemptedCollectionsByCollectorUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionsByCollector(input);
  }
}

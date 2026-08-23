import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";


export interface GetAttemptedCollectionsByRouteUseCaseInput {
  companyId: string;
  idRoute: string;
}

export interface GetAttemptedCollectionsByRouteUseCaseOutput {
  attempts: AttemptedCollection[];
}

export default class GetAttemptedCollectionsByRouteUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: GetAttemptedCollectionsByRouteUseCaseInput): Promise<Result<GetAttemptedCollectionsByRouteUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.gateway.getAttemptedCollectionsByRoute(input);
  }
}

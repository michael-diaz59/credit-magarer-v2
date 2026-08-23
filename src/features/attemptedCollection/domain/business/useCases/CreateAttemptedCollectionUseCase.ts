import type { Result } from "../../../../../core/helpers/ResultC";
import type AttemptedCollectionGateway from "../../infraestructure/AttemptedCollectionGateway";
import type AttemptedCollection from "../entities/AttemptedCollection";
import type { AttemptedCollectionErrors } from "../entities/types";


export interface CreateAttemptedCollectionUseCaseInput {
  companyId: string;
  attempt: AttemptedCollection;
}

export interface CreateAttemptedCollectionUseCaseOutput {
  id: string;
}

export default class CreateAttemptedCollectionUseCase {
  private gateway: AttemptedCollectionGateway;

  constructor(gateway: AttemptedCollectionGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateAttemptedCollectionUseCaseInput): Promise<Result<CreateAttemptedCollectionUseCaseOutput, AttemptedCollectionErrors>> {
    const result = await this.gateway.createAttemptedCollection(input);
    if (result.ok) {
      return { ok: true, value: { id: result.value } };
    }
    return { ok: false, error: result.error };
  }
}

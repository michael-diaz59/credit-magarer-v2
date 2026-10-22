import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { CollectionAttempt } from "../../entities/CollectionAttempt";
import type { CollectionAttemptGateway, CollectionAttemptError } from "../../../infraestructure/CollectionAttemptGateway";

export interface GetCollectionAttemptsByDateInput {
    companyId: string;
    date: string;
}

export interface GetCollectionAttemptsByDateOutput {
    attempts: CollectionAttempt[];
}

export type GetCollectionAttemptsByDateError = CollectionAttemptError;

export class GetCollectionAttemptsByDateUseCase {
    private readonly attemptGateway: CollectionAttemptGateway;

    constructor(attemptGateway: CollectionAttemptGateway) {
        this.attemptGateway = attemptGateway;
    }

    async execute(input: GetCollectionAttemptsByDateInput): Promise<Result<GetCollectionAttemptsByDateOutput, GetCollectionAttemptsByDateError>> {
        try {
            const result = await this.attemptGateway.getAllByDate(input.companyId, input.date);
            if (!result.ok) {
                return fail(result.error);
            }
            return ok({ attempts: result.value });
        } catch (error) {
            console.error("[GetCollectionAttemptsByDateUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}

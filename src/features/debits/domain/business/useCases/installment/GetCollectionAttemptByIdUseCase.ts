import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { CollectionAttempt } from "../../entities/CollectionAttempt";
import type { CollectionAttemptGateway, CollectionAttemptError } from "../../../infraestructure/CollectionAttemptGateway";

export interface GetCollectionAttemptByIdInput {
    companyId: string;
    attemptId: string;
}

export interface GetCollectionAttemptByIdOutput {
    attempt: CollectionAttempt;
}

export type GetCollectionAttemptByIdError = CollectionAttemptError;

export class GetCollectionAttemptByIdUseCase {
    private readonly attemptGateway: CollectionAttemptGateway;

    constructor(attemptGateway: CollectionAttemptGateway) {
        this.attemptGateway = attemptGateway;
    }

    async execute(input: GetCollectionAttemptByIdInput): Promise<Result<GetCollectionAttemptByIdOutput, GetCollectionAttemptByIdError>> {
        try {
            const result = await this.attemptGateway.getById(input.companyId, input.attemptId);
            if (!result.ok) {
                return fail(result.error);
            }
            return ok({ attempt: result.value });
        } catch (error) {
            console.error("[GetCollectionAttemptByIdUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}

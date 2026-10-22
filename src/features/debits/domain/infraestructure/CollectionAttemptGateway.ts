import type { Result } from "../../../../core/helpers/ResultC";
import type { CollectionAttempt } from "../business/entities/CollectionAttempt";

export interface CreateCollectionAttemptInput {
    companyId: string;
    attempt: CollectionAttempt;
}

export type CollectionAttemptError =
    | { code: "NOT_FOUND" }
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export interface CollectionAttemptGateway {
    create(input: CreateCollectionAttemptInput): Promise<Result<null, CollectionAttemptError>>;
    getAllByDate(companyId: string, date: string): Promise<Result<CollectionAttempt[], CollectionAttemptError>>;
    getById(companyId: string, id: string): Promise<Result<CollectionAttempt, CollectionAttemptError>>;
}

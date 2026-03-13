import type { Result } from "../../../../core/helpers/ResultC";
import type { CollectionAttempt } from "../business/entities/CollectionAttempt";

export interface CreateCollectionAttemptInput {
    companyId: string;
    attempt: CollectionAttempt;
}

export interface CollectionAttemptGateway {
    create(input: CreateCollectionAttemptInput): Promise<Result<null, any>>;
    getAllByDate(companyId: string, date: string): Promise<Result<CollectionAttempt[], any>>;
    getById(companyId: string, id: string): Promise<Result<CollectionAttempt, any>>;
}

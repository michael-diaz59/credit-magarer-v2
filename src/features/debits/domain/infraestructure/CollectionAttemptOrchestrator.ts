import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { FirebaseCollectionAttemptRepository } from "../../provider/firebase/FirebaseCollectionAttemptRepository";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";
import type { CollectionAttemptGateway } from "./CollectionAttemptGateway";
import type { CollectionAttempt } from "../business/entities/CollectionAttempt";
import {
    CreateCollectionAttemptUseCase,
    type CreateCollectionAttemptInput,
    type CreateCollectionAttemptError,
} from "../business/useCases/installment/CreateCollectionAttemptUseCase";
import {
    GetCollectionAttemptsByDateUseCase,
    type GetCollectionAttemptsByDateError,
} from "../business/useCases/installment/GetCollectionAttemptsByDateUseCase";
import {
    GetCollectionAttemptByIdUseCase,
    type GetCollectionAttemptByIdError,
} from "../business/useCases/installment/GetCollectionAttemptByIdUseCase";
import { ok, fail, type Result } from "../../../../core/helpers/ResultC";

export class CollectionAttemptOrchestrator {
    private readonly createUseCase: CreateCollectionAttemptUseCase;
    private readonly getAttemptsByDateUseCase: GetCollectionAttemptsByDateUseCase;
    private readonly getAttemptByIdUseCase: GetCollectionAttemptByIdUseCase;

    constructor() {
        const attemptGateway: CollectionAttemptGateway = new FirebaseCollectionAttemptRepository();
        const installmentGateway = new FirebaseInstallmentRepository();
        const debtGateway = new FirebaseDebtRepository();

        this.createUseCase = new CreateCollectionAttemptUseCase(attemptGateway, installmentGateway, debtGateway);
        this.getAttemptsByDateUseCase = new GetCollectionAttemptsByDateUseCase(attemptGateway);
        this.getAttemptByIdUseCase = new GetCollectionAttemptByIdUseCase(attemptGateway);
    }

    async createAttempt(input: CreateCollectionAttemptInput): Promise<Result<null, CreateCollectionAttemptError>> {
        return this.createUseCase.execute(input);
    }

    async getAttemptsByDate(companyId: string, date: string): Promise<Result<CollectionAttempt[], GetCollectionAttemptsByDateError>> {
        const res = await this.getAttemptsByDateUseCase.execute({ companyId, date });
        if (!res.ok) {
            return fail(res.error);
        }
        return ok(res.value.attempts);
    }

    async getAttemptById(companyId: string, id: string): Promise<Result<CollectionAttempt, GetCollectionAttemptByIdError>> {
        const res = await this.getAttemptByIdUseCase.execute({ companyId, attemptId: id });
        if (!res.ok) {
            return fail(res.error);
        }
        return ok(res.value.attempt);
    }
}


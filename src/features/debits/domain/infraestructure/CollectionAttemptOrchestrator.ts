import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { FirebaseCollectionAttemptRepository } from "../../provider/firebase/FirebaseCollectionAttemptRepository";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";
import {
    CreateCollectionAttemptUseCase,
    type CreateCollectionAttemptUseCaseInput
} from "../business/useCases/installment/CreateCollectionAttemptUseCase";

export class CollectionAttemptOrchestrator {
    private createUseCase: CreateCollectionAttemptUseCase;
    private attemptRepo: FirebaseCollectionAttemptRepository;

    constructor() {
        this.attemptRepo = new FirebaseCollectionAttemptRepository();
        const installmentRepo = new FirebaseInstallmentRepository();
        const debtRepo = new FirebaseDebtRepository();
        this.createUseCase = new CreateCollectionAttemptUseCase(this.attemptRepo, installmentRepo, debtRepo);
    }

    async createAttempt(input: CreateCollectionAttemptUseCaseInput) {
        return await this.createUseCase.execute(input);
    }

    async getAttemptsByDate(companyId: string, date: string) {
        return await this.attemptRepo.getAllByDate(companyId, date);
    }

    async getAttemptById(companyId: string, id: string) {
        return await this.attemptRepo.getById(companyId, id);
    }
}

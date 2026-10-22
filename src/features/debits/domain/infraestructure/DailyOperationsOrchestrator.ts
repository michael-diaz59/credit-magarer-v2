import type { Result } from "../../../../core/helpers/ResultC";
import { FirebaseUserRepository } from "../../../users/provider/firebase/FirebaseUserRepository";
import { FirebaseRouteRepository } from "../../../routes/provider/firebase/FirebaseRouteRepository";
import { FirebasePaymentRepository } from "../../provider/firebase/FirebasePaymentRepository";
import { FirebaseCollectionAttemptRepository } from "../../provider/firebase/FirebaseCollectionAttemptRepository";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";

import {
    GetDailyOperationsUseCase,
    type GetDailyOperationsUseCaseInput,
    type GetDailyOperationsUseCaseOutput,
    type GetDailyOperationsUseCaseError,
} from "../business/useCases/audit/GetDailyOperationsUseCase";

export class DailyOperationsOrchestrator {
    private readonly getDailyOperationsUseCase: GetDailyOperationsUseCase;

    constructor() {
        const userGateway = new FirebaseUserRepository();
        const routeGateway = new FirebaseRouteRepository();
        const paymentGateway = new FirebasePaymentRepository();
        const collectionAttemptGateway = new FirebaseCollectionAttemptRepository();
        const debtGateway = new FirebaseDebtRepository();
        const installmentGateway = new FirebaseInstallmentRepository();

        this.getDailyOperationsUseCase = new GetDailyOperationsUseCase(
            userGateway,
            routeGateway,
            paymentGateway,
            collectionAttemptGateway,
            debtGateway,
            installmentGateway
        );
    }

    async getDailyOperations(
        input: GetDailyOperationsUseCaseInput
    ): Promise<Result<GetDailyOperationsUseCaseOutput, GetDailyOperationsUseCaseError>> {
        return this.getDailyOperationsUseCase.execute(input);
    }
}

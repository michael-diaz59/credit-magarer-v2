import type { Result } from "../../../../core/helpers/ResultC";
import type { AttemptedCollectionErrors } from "../business/entities/types";
import type { CreateAttemptedCollectionUseCaseInput } from "../business/useCases/CreateAttemptedCollectionUseCase";
import type { GetAttemptedCollectionByIdUseCaseInput, GetAttemptedCollectionByIdUseCaseOutput } from "../business/useCases/GetAttemptedCollectionByIdUseCase";
import type { GetAttemptedCollectionsByRouteUseCaseInput, GetAttemptedCollectionsByRouteUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByRouteUseCase";
import type { GetAttemptedCollectionsByInstallmentUseCaseInput, GetAttemptedCollectionsByInstallmentUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByInstallmentUseCase";
import type { GetAttemptedCollectionsByDebtUseCaseInput, GetAttemptedCollectionsByDebtUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByDebtUseCase";
import type { GetAttemptedCollectionsByClientUseCaseInput, GetAttemptedCollectionsByClientUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByClientUseCase";
import type { GetAttemptedCollectionsByCollectorUseCaseInput, GetAttemptedCollectionsByCollectorUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByCollectorUseCase";
import type { GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput, GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByDateRangeAndDebtUseCase";

export default interface AttemptedCollectionGateway {
  createAttemptedCollection(input: CreateAttemptedCollectionUseCaseInput): Promise<Result<string, AttemptedCollectionErrors>>;
  getAttemptedCollectionById(input: GetAttemptedCollectionByIdUseCaseInput): Promise<Result<GetAttemptedCollectionByIdUseCaseOutput, AttemptedCollectionErrors>>;
  getAttemptedCollectionsByRoute(input: GetAttemptedCollectionsByRouteUseCaseInput): Promise<Result<GetAttemptedCollectionsByRouteUseCaseOutput, AttemptedCollectionErrors>>;
  getAttemptedCollectionsByInstallment(input: GetAttemptedCollectionsByInstallmentUseCaseInput): Promise<Result<GetAttemptedCollectionsByInstallmentUseCaseOutput, AttemptedCollectionErrors>>;
  getAttemptedCollectionsByDebt(input: GetAttemptedCollectionsByDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDebtUseCaseOutput, AttemptedCollectionErrors>>;
  getAttemptedCollectionsByClient(input: GetAttemptedCollectionsByClientUseCaseInput): Promise<Result<GetAttemptedCollectionsByClientUseCaseOutput, AttemptedCollectionErrors>>;
  getAttemptedCollectionsByCollector(input: GetAttemptedCollectionsByCollectorUseCaseInput): Promise<Result<GetAttemptedCollectionsByCollectorUseCaseOutput, AttemptedCollectionErrors>>;
  getAttemptedCollectionsByDateRangeAndDebt(input: GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput, AttemptedCollectionErrors>>;
}

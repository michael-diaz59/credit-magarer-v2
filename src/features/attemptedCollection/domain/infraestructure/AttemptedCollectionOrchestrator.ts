import type { Result } from "../../../../core/helpers/ResultC";
import FirebaseAttemptedCollectionRepository from "../../repository/firebase/FirebaseAttemptedCollectionRepository";
import type { AttemptedCollectionErrors } from "../business/entities/types";
import CreateAttemptedCollectionUseCase, { type CreateAttemptedCollectionUseCaseInput, type CreateAttemptedCollectionUseCaseOutput } from "../business/useCases/CreateAttemptedCollectionUseCase";
import GetAttemptedCollectionByIdUseCase, { type GetAttemptedCollectionByIdUseCaseInput, type GetAttemptedCollectionByIdUseCaseOutput } from "../business/useCases/GetAttemptedCollectionByIdUseCase";
import GetAttemptedCollectionsByClientUseCase, { type GetAttemptedCollectionsByClientUseCaseInput, type GetAttemptedCollectionsByClientUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByClientUseCase";
import GetAttemptedCollectionsByCollectorUseCase, { type GetAttemptedCollectionsByCollectorUseCaseInput, type GetAttemptedCollectionsByCollectorUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByCollectorUseCase";
import GetAttemptedCollectionsByDateRangeAndDebtUseCase, { type GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput, type GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByDateRangeAndDebtUseCase";
import GetAttemptedCollectionsByDebtUseCase, { type GetAttemptedCollectionsByDebtUseCaseInput, type GetAttemptedCollectionsByDebtUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByDebtUseCase";
import GetAttemptedCollectionsByInstallmentUseCase, { type GetAttemptedCollectionsByInstallmentUseCaseInput, type GetAttemptedCollectionsByInstallmentUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByInstallmentUseCase";
import GetAttemptedCollectionsByRouteUseCase, { type GetAttemptedCollectionsByRouteUseCaseInput, type GetAttemptedCollectionsByRouteUseCaseOutput } from "../business/useCases/GetAttemptedCollectionsByRouteUseCase";
import type AttemptedCollectionGateway from "./AttemptedCollectionGateway";


export default class AttemptedCollectionOrchestrator {
  private createAttemptedCollectionUseCase: CreateAttemptedCollectionUseCase;
  private getAttemptedCollectionByIdUseCase: GetAttemptedCollectionByIdUseCase;
  private getAttemptedCollectionsByRouteUseCase: GetAttemptedCollectionsByRouteUseCase;
  private getAttemptedCollectionsByInstallmentUseCase: GetAttemptedCollectionsByInstallmentUseCase;
  private getAttemptedCollectionsByDebtUseCase: GetAttemptedCollectionsByDebtUseCase;
  private getAttemptedCollectionsByClientUseCase: GetAttemptedCollectionsByClientUseCase;
  private getAttemptedCollectionsByCollectorUseCase: GetAttemptedCollectionsByCollectorUseCase;
  private getAttemptedCollectionsByDateRangeAndDebtUseCase: GetAttemptedCollectionsByDateRangeAndDebtUseCase;

  constructor() {
    const repository: AttemptedCollectionGateway = new FirebaseAttemptedCollectionRepository();

    this.createAttemptedCollectionUseCase = new CreateAttemptedCollectionUseCase(repository);
    this.getAttemptedCollectionByIdUseCase = new GetAttemptedCollectionByIdUseCase(repository);
    this.getAttemptedCollectionsByRouteUseCase = new GetAttemptedCollectionsByRouteUseCase(repository);
    this.getAttemptedCollectionsByInstallmentUseCase = new GetAttemptedCollectionsByInstallmentUseCase(repository);
    this.getAttemptedCollectionsByDebtUseCase = new GetAttemptedCollectionsByDebtUseCase(repository);
    this.getAttemptedCollectionsByClientUseCase = new GetAttemptedCollectionsByClientUseCase(repository);
    this.getAttemptedCollectionsByCollectorUseCase = new GetAttemptedCollectionsByCollectorUseCase(repository);
    this.getAttemptedCollectionsByDateRangeAndDebtUseCase = new GetAttemptedCollectionsByDateRangeAndDebtUseCase(repository);
  }

  async createAttemptedCollection(input: CreateAttemptedCollectionUseCaseInput): Promise<Result<CreateAttemptedCollectionUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.createAttemptedCollectionUseCase.execute(input);
  }

  async getAttemptedCollectionById(input: GetAttemptedCollectionByIdUseCaseInput): Promise<Result<GetAttemptedCollectionByIdUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionByIdUseCase.execute(input);
  }

  async getAttemptedCollectionsByRoute(input: GetAttemptedCollectionsByRouteUseCaseInput): Promise<Result<GetAttemptedCollectionsByRouteUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionsByRouteUseCase.execute(input);
  }

  async getAttemptedCollectionsByInstallment(input: GetAttemptedCollectionsByInstallmentUseCaseInput): Promise<Result<GetAttemptedCollectionsByInstallmentUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionsByInstallmentUseCase.execute(input);
  }

  async getAttemptedCollectionsByDebt(input: GetAttemptedCollectionsByDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDebtUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionsByDebtUseCase.execute(input);
  }

  async getAttemptedCollectionsByClient(input: GetAttemptedCollectionsByClientUseCaseInput): Promise<Result<GetAttemptedCollectionsByClientUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionsByClientUseCase.execute(input);
  }

  async getAttemptedCollectionsByCollector(input: GetAttemptedCollectionsByCollectorUseCaseInput): Promise<Result<GetAttemptedCollectionsByCollectorUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionsByCollectorUseCase.execute(input);
  }

  async getAttemptedCollectionsByDateRangeAndDebt(input: GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput, AttemptedCollectionErrors>> {
    return await this.getAttemptedCollectionsByDateRangeAndDebtUseCase.execute(input);
  }
}

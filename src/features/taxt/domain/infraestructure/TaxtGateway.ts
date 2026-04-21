import type { Result } from "../../../../core/helpers/ResultC";
import type { TaxtPayment } from "../business/entities/TaxtPayment";

export default interface TaxtGateway {
  create(companyId: string, payment: Omit<TaxtPayment, 'id'>, file?: File): Promise<Result<string, Error>>;
  update(companyId: string, payment: TaxtPayment, file?: File): Promise<Result<void, Error>>;
  getAll(companyId: string): Promise<Result<TaxtPayment[], Error>>;
  getById(companyId: string, id: string): Promise<Result<TaxtPayment | null, Error>>;
  delete(companyId: string, id: string): Promise<Result<void, Error>>;
}

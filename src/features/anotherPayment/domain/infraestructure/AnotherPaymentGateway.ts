import type { Result } from "../../../../core/helpers/ResultC";
import type { AnotherPayment } from "../business/entities/AnotherPayment";

export default interface AnotherPaymentGateway {
  create(companyId: string, payment: Omit<AnotherPayment, 'id'>, file?: File): Promise<Result<string, Error>>;
  update(companyId: string, payment: AnotherPayment, file?: File): Promise<Result<void, Error>>;
  getAll(companyId: string): Promise<Result<AnotherPayment[], Error>>;
  getById(companyId: string, id: string): Promise<Result<AnotherPayment | null, Error>>;
  delete(companyId: string, id: string): Promise<Result<void, Error>>;
}

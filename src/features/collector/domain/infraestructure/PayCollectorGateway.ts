import type { Result } from "../../../../core/helpers/ResultC";
import type { CollectorPayment } from "../business/entities/CollectorPayment";
import type { CreatePayCollectorError, CreatePayCollectorOutput } from "../business/useCases/CreatePayCollectorCase";
import type { GetPayCollectorsError, GetPayCollectorsInput, GetPayCollectorsOutput } from "../business/useCases/GetPaysCollectorCase";

export interface CreatePayCollectorGatewayInput {
  payCollector: CollectorPayment,
  companyId: string
}
export interface PayCollectorGateway {
  createPayCollector(input: CreatePayCollectorGatewayInput): Promise<Result<CreatePayCollectorOutput, CreatePayCollectorError>>
  getPayCollectors(input: GetPayCollectorsInput): Promise<Result<GetPayCollectorsOutput, GetPayCollectorsError>>
}
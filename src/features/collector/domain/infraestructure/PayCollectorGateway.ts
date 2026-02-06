import type { Result } from "../../../../core/helpers/ResultC";
import type { CreatePayCollectorError, CreatePayCollectorInput, CreatePayCollectorOutput } from "../business/useCases/CreatePayCollectorCase";
import type { GetPayCollectorsError, GetPayCollectorsInput, GetPayCollectorsOutput } from "../business/useCases/GetPaysCollectorCase";

export interface PayCollectorGateway {
  createPayCollector( input: CreatePayCollectorInput): Promise<Result<CreatePayCollectorOutput, CreatePayCollectorError>>
  getPayCollectors( input: GetPayCollectorsInput): Promise<Result<GetPayCollectorsOutput, GetPayCollectorsError>>
}
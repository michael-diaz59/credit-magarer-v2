import type { Result } from "../../../../../core/helpers/ResultC";
import type { PayCollectorGateway } from "../../infraestructure/PayCollectorGateway";
import type { CollectorPayment } from "../entities/CollectorPayment";

export type GetPayCollectorsError =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" };

export interface GetPayCollectorsInput {
  companyId: string;
  collectorId?: string; // 👈 OPCIONAL
}

export interface GetPayCollectorsOutput {
  state: CollectorPayment[];
}

/**obtener los pagos, opcionalmente puede traer un cobrador para obtener los pagos de un cobrador */
export class GetPaysCollectorCase {
     private payCollectorGateway: PayCollectorGateway

     constructor(
             userRepository: PayCollectorGateway
         ) {
             this.payCollectorGateway = userRepository
         }

    async execute( input: GetPayCollectorsInput): Promise<Result<GetPayCollectorsOutput, GetPayCollectorsError>>{
        // Implementation to get user details
           return await this.payCollectorGateway.getPayCollectors(
            input
        )
    }

}
import type { Result } from "../../../../../core/helpers/ResultC";
import type { PayCollectorGateway } from "../../infraestructure/PayCollectorGateway";
import type { CollectorPayment } from "../entities/CollectorPayment";

export type CreatePayCollectorError= 
    | { code: "USER_NOT_FOUND"}
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface CreatePayCollectorInput {
    collectorId: string
    companyId: string
    payCollector: CollectorPayment
}


export interface CreatePayCollectorOutput {
    state: null
}

/**crear un pago que debe hacer un cobrador */
export class CreatePayCollectorCase {
     private payCollectorGateway: PayCollectorGateway

     constructor(
             userRepository: PayCollectorGateway
         ) {
             this.payCollectorGateway = userRepository
         }

         /**crear un pago que debe hacer un cobrador */
    async execute( input: CreatePayCollectorInput): Promise<Result<CreatePayCollectorOutput, CreatePayCollectorError>>{
        
           return await this.payCollectorGateway.createPayCollector(
            input
        )
    }

}
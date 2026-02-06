import type { Result } from "../../../../core/helpers/ResultC";
import { FirebaseUserRepository } from "../../repository/firebase/PayCollectorFirebaseRep";
import { CreatePayCollectorCase, type CreatePayCollectorError, type CreatePayCollectorInput, type CreatePayCollectorOutput } from "../business/useCases/CreatePayCollectorCase";
import { GetPaysCollectorCase, type GetPayCollectorsError, type GetPayCollectorsInput, type GetPayCollectorsOutput } from "../business/useCases/GetPaysCollectorCase";
import type { PayCollectorGateway } from "./PayCollectorGateway";

export default class PayCollectorOrhectrator {

    
      private createPayCollectorCase: CreatePayCollectorCase

      private getPayCollectorsCase: GetPaysCollectorCase

      constructor(
        ) {
            const gateway: PayCollectorGateway = new FirebaseUserRepository()
            
            this.createPayCollectorCase=new CreatePayCollectorCase(gateway)
            this.getPayCollectorsCase= new GetPaysCollectorCase(gateway)
        }

        async createPayCollector( input: CreatePayCollectorInput): Promise<Result<CreatePayCollectorOutput, CreatePayCollectorError>>{

            return this.createPayCollectorCase.execute(input)
        }

        async getPayCollectors( input: GetPayCollectorsInput): Promise<Result<GetPayCollectorsOutput, GetPayCollectorsError>>{
              return this.getPayCollectorsCase.execute(input)
        }

}
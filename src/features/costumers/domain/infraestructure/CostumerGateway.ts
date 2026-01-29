import type { Result } from "../../../../core/helpers/ResultC";
import type { Costumer } from "../business/entities/Costumer";
//import type { FamilyReference } from "../business/entities/FamilyReference";
//import type { PersonalInfo } from "../business/entities/PersonalInfo";
import type { GetCostumerByIdErrors, GetCostumersErrors, SaveCostumerError } from "../business/entities/utilities";
import type { SaveCostumerInput } from "../business/useCases/CreateCostumerCase";
//import type { Vehicle } from "../business/entities/Vehicle";
import type { DeleteCostumerInput } from "../business/useCases/DeleteCostumerCase";
import type { GetCostumerByIdNumberInput, GetCostumerByIdNumberOutput } from "../business/useCases/GetCostumerByIdNumber";
import type { UpdateCostumerInput } from "../business/useCases/UpdateCostumerCase";

export default interface CostumerGateway {
    getCostumers(companyId: string): Promise<Result<Costumer[], GetCostumersErrors>>
    getCostumerById(companyId: string, costumerId: string): Promise<Result<Costumer | null, GetCostumerByIdErrors>>
    UpdateCostumer(input: UpdateCostumerInput): Promise<Result<void, SaveCostumerError>>
    createCostumer(saveCostumerInput: SaveCostumerInput): Promise<Result<void, SaveCostumerError>>
    deleteCostumer(deleteCostumerInput:DeleteCostumerInput): Promise<Result<null, SaveCostumerError>>
    getCostumerByIdNumber(input:GetCostumerByIdNumberInput ): Promise<GetCostumerByIdNumberOutput>


    //updateApplicant(costumerId: string, applicant: PersonalInfo): Promise<Result<void, SaveCostumerError>>
    //updateCoSigners(costumerId: string, coSigner: PersonalInfo[]): Promise<Result<void, SaveCostumerError>>
    //updateVehicles(costumerId: string, vehicles: Vehicle[]): Promise<Result<void, SaveCostumerError>>
    //updateFamilyReferences(costumerId: string, familyReference: FamilyReference[]): Promise<Result<void, SaveCostumerError>>
}
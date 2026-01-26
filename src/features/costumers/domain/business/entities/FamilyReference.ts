import type { Address } from "./Address";
import type { HousingType } from "./HousingInfo";
import type { WorkInfo } from "./WorkInfo";


export interface FamilyReference {
  fullName: string;
  //parentesco
  relationship: string;
  phone: string;

  address: Address;
  housingType: HousingType;
  workInfo: WorkInfo;
}

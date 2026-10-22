import type { AddressFirestore } from "./AddressFirestore";
import type { HousingType } from "../../domain/business/entities/HousingInfo";
import type { WorkInfoFirestore } from "./WorkInfoFirestore";

export interface FamilyReferenceFirestore {
  fullName: string;
  relationship: string;
  phone: string;
  address: AddressFirestore;
  housingType: HousingType;
  workInfo: WorkInfoFirestore;
  observations: string;
}

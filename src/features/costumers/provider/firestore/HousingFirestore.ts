import type { HousingType } from "../../domain/business/entities/HousingInfo";




export interface HousingFirestore {
  type: HousingType;
  landlordName?: string;
  landlordPhone?: string;
  rentValue?: number;
}

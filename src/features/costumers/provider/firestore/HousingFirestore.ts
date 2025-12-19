import type { HousingType } from "../../domain/utilities";


export interface HousingFirestore {
  type: HousingType;
  landlordName?: string;
  landlordPhone?: string;
  rentValue?: number;
}

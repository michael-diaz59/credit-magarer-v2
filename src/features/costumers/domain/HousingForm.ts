import type { HousingType } from "./utilities";


export interface HousingForm {
  type: HousingType;

  landlordName: string;
  landlordPhone: string;
  rentValue: number;
}

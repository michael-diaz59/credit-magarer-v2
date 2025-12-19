import type { AddressForm } from "./AddressForm";
import type { HousingType } from "./utilities";
import type { WorkInfoForm } from "./WorkInfoForm";


export interface FamilyReferenceForm {
  fullName: string;
  relationship: string;
  phone: string;

  residenceAddress: AddressForm;
  housingType: HousingType;
  workInfo: WorkInfoForm;
}

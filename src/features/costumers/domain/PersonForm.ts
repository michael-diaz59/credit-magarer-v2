import type { AddressForm } from "./AddressForm";
import type { HousingForm } from "./HousingForm";
import type { MaritalStatus } from "./utilities";
import type { WorkInfoForm } from "./WorkInfoForm";


export interface PersonForm {
  fullName: string;
  idNumber: string;

  birthCity: string;
  birthDate: string; // yyyy-mm-dd
  issueCity: string;

  maritalStatus: MaritalStatus;
  childrenCount: number;
  phone: string;

  residenceAddress: AddressForm;
  housing: HousingForm;
  workInfo: WorkInfoForm;
}

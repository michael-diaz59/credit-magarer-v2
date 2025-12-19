import type { PersonForm } from "./PersonForm";
import type { VehicleForm } from "./VehicleForm";
import type { FamilyReferenceForm } from "./FamilyReferenceForm";

export interface ClientFormValues {
  applicant: PersonForm;
  coSigner?: PersonForm;

  vehicle?: VehicleForm;
  familyReference?: FamilyReferenceForm;
}

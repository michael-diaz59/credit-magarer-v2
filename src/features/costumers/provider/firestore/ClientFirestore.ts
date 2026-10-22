import type { PersonFirestore } from './PersonFirestore';
import type { Vehicle } from '../../domain/business/entities/Vehicle';
import type { FamilyReferenceFirestore } from './FamilyReferenceFirestore';

export interface ClientFirestore {
  applicant: PersonFirestore;
  coSigner?: PersonFirestore[];

  vehicle?: Vehicle[];
  familyReference?: FamilyReferenceFirestore[];
  active: boolean;
}

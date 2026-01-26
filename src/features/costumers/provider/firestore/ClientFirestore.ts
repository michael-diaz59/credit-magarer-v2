import type { PersonFirestore } from './PersonFirestore';
import type { Vehicle } from '../../domain/business/entities/Vehicle';
import type { FamilyReference } from '../../domain/business/entities/FamilyReference';

export interface ClientFirestore {
  applicant: PersonFirestore;
  coSigner?: PersonFirestore[];

  vehicle?: Vehicle[];
  familyReference?: FamilyReference[];
  active: boolean;
}

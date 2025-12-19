import { Timestamp } from 'firebase/firestore';
import type { PersonFirestore } from './PersonFirestore';
import type { VehicleForm } from '../../domain/VehicleForm';
import type { FamilyReferenceForm } from '../../domain/FamilyReferenceForm';

export interface ClientFirestore {
  applicant: PersonFirestore;
  coSigner?: PersonFirestore;

  vehicle?: VehicleForm;
  familyReference?: FamilyReferenceForm;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  active: boolean;
}

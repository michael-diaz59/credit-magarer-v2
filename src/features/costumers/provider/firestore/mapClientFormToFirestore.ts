import { Timestamp } from 'firebase/firestore';
import type { ClientFirestore } from './ClientFirestore';
import type { PersonFirestore } from './PersonFirestore';
import type { FamilyReferenceFirestore } from './FamilyReferenceFirestore';
import type { Customer } from '../../domain/business/entities/Customer';
import type { PersonalInfo } from '../../domain/business/entities/PersonalInfo';
import type { FamilyReference } from '../../domain/business/entities/FamilyReference';

export const mapClientFormToFirestore = (
  form: Customer
): ClientFirestore => ({
  applicant: mapPerson(form.applicant),
  coSigner: form.coSigner?.map(mapPerson),
  vehicle: form.vehicle,
  familyReference: form.familyReference?.map(mapFamilyReferenceToFirestore),
  active: true,
});

export const mapFamilyReferenceToFirestore = (
  ref: FamilyReference
): FamilyReferenceFirestore => ({
  fullName: ref.fullName ?? '',
  relationship: ref.relationship ?? '',
  phone: ref.phone ?? '',
  housingType: ref.housingType ?? 'FAMILIAR',
  address: ref.address,
  workInfo: ref.workInfo,
  observations: ref.observations ?? '',
});

const mapPerson = (person: PersonalInfo): PersonFirestore => ({
  ...person,
  birthDate: Timestamp.fromDate(new Date(person.birthDate)),
  issueDate: Timestamp.fromDate(new Date(person.issueDate)),
});

import { Timestamp } from 'firebase/firestore';
import type { ClientFirestore } from './ClientFirestore';
import type { PersonFirestore } from './PersonFirestore';
import type { Costumer } from '../../domain/business/entities/Costumer';
import type { PersonalInfo } from '../../domain/business/entities/PersonalInfo';

export const mapClientFormToFirestore = (
  form: Costumer
): ClientFirestore => ({
  applicant: mapPerson(form.applicant),
  coSigner: form.coSigner?.map(mapPerson) ,
  vehicle: form.vehicle,
  familyReference: form.familyReference,
  active: true,
});

const mapPerson = (person: PersonalInfo): PersonFirestore => ({
  ...person,
  birthDate: Timestamp.fromDate(new Date(person.birthDate)),
  issueDate: Timestamp.fromDate(new Date(person.issueDate)),

});

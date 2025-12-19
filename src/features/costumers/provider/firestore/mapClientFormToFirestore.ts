import { Timestamp } from 'firebase/firestore';
import type { ClientFormValues } from '../../domain/ClientFormValues';
import type { ClientFirestore } from './ClientFirestore';
import type { PersonFirestore } from './PersonFirestore';
import type { PersonForm } from '../../domain/PersonForm';

export const mapClientFormToFirestore = (
  form: ClientFormValues
): ClientFirestore => ({
  applicant: mapPerson(form.applicant),
  coSigner: form.coSigner ? mapPerson(form.coSigner) : undefined,
  vehicle: form.vehicle,
  familyReference: form.familyReference,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  active: true,
});

const mapPerson = (person: PersonForm): PersonFirestore => ({
  ...person,
  birthDate: Timestamp.fromDate(new Date(person.birthDate)),
});

import type { CostumerFormValues } from "../../../atomic_design/templates/costumers/SchemasCostumer";
import type { Address } from "../domain/business/entities/Address";
import type { Customer } from "../domain/business/entities/Customer";
import type { FamilyReference } from "../domain/business/entities/FamilyReference";
import type { HousingInfo } from "../domain/business/entities/HousingInfo";
import type { PersonalInfo } from "../domain/business/entities/PersonalInfo";
import type { Vehicle } from "../domain/business/entities/Vehicle";
import type { WorkInfo } from "../domain/business/entities/WorkInfo";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
  ? DeepPartial<T[K]>
  : T[K];
};

export function normalizeAddress(a?: FormAddress): Address {
  const lat = a?.location?.latitud ?? 0;
  const lng = a?.location?.longitud ?? 0;

  return {
    address: a?.address ?? "",
    neighborhood: a?.neighborhood ?? "",
    stratum: a?.stratum ?? 1,
    city: a?.city ?? "",
    location: {
      latitud: lat,
      longitud: lng,
      coordenadas: lat && lng ? `${lat},${lng}` : "",
    },
  };
}
export function normalizeWorkInfo(w?: DeepPartial<WorkInfo>): WorkInfo {
  return {
    profession: w?.profession ?? "",
    economicSector: w?.economicSector ?? "",
    company: w?.company ?? "",
    companyAddress: w?.companyAddress ?? "",
  };
}
export function normalizeHousing(h?: DeepPartial<HousingInfo>): HousingInfo {
  return {
    type: h?.type ?? "FAMILIAR",
    landlordName: h?.landlordName ?? "",
    landlordPhone: h?.landlordPhone ?? "",
    rentValue: h?.rentValue ?? 0,

  };
}
export function normalizePersonalInfo(
  p?: DeepPartial<PersonalInfo>
): PersonalInfo {
  return {
    fullName: p?.fullName ?? "",
    idNumber: p?.idNumber ?? "",
    birthCity: p?.birthCity ?? "",
    birthDate: p?.birthDate ?? "",
    issueCity: p?.issueCity ?? "",
    issueDate: p?.issueDate ?? "",
    maritalStatus: p?.maritalStatus ?? "SOLTERO",
    childrenCount: p?.childrenCount ?? 0,
    phone: p?.phone ?? "",

    address: normalizeAddress(p?.address),
    housing: normalizeHousing(p?.housing),
    workInfo: normalizeWorkInfo(p?.workInfo),
  };
}
export function normalizeVehicle(v?: DeepPartial<Vehicle>): Vehicle {
  return {
    vehicleClass: v?.vehicleClass ?? "",
    model: v?.model ?? "",
    brand: v?.brand ?? "",
    commercialValue: v?.commercialValue ?? 0,
    pledged: v?.pledged ?? false,
    serviceType: v?.serviceType ?? "PARTICULAR",
  };
}
export function normalizeFamilyReference(
  f?: DeepPartial<FamilyReference>
): FamilyReference {
  return {
    fullName: f?.fullName ?? "",
    relationship: f?.relationship ?? "",
    phone: f?.phone ?? "",
    housingType: f?.housingType ?? "FAMILIAR",

    address: normalizeAddress(f?.address),
    workInfo: normalizeWorkInfo(f?.workInfo),
  };
}


export class CostumerFormMapper {

  static toDomain(form: CostumerFormValues): Customer {
    if (!form.applicant) {
      throw new Error("Applicant is required");
    }

    return {
      id: form.id ?? crypto.randomUUID(),
      debtCounter: form.debtCounter ?? 0,
      listId: form.listId ?? "",
      observations: form.observations ?? "",
      photoHouseUrl: form.photoHouseUrl ?? "",
      identificacionUrl: form.identificacionUrl ?? "",
      laboralUrl: form.laboralUrl ?? "",
      documentUrl: form.documentUrl ?? "",

      calification:form.calification??"3",
      applicant: normalizePersonalInfo(form.applicant),

      coSigner: (form.coSigner ?? []).map(normalizePersonalInfo),

      vehicle: (form.vehicle ?? []).map(normalizeVehicle),

      familyReference: (form.familyReference ?? []).map(
        normalizeFamilyReference
      ),
    };
  }
  static toForm(costumer: Customer): CostumerFormValues {
     return {
    debtCounter: costumer.debtCounter,
    observations: costumer.observations,
    id: costumer.id,
    listId: costumer.listId,
    calification: costumer.calification,

    applicant: personalInfoToForm(costumer.applicant),

    coSigner: (costumer.coSigner ?? []).map(personalInfoToForm),

    vehicle: costumer.vehicle ?? [],
    familyReference: costumer.familyReference ?? [],
  };
  }
}

type FormAddress = {
  address?: string;
  neighborhood?: string;
  stratum?: number;
  city?: string;
  location?: {
    latitud?: number;
    longitud?: number;
  };
};

function personalInfoToForm(p: PersonalInfo) {

  return {
    ...p,
    address: addressToForm(p.address),
  };
}

function addressToForm(a?: Address): FormAddress | undefined {
  if (!a) return undefined;

  return {
    address: a.address,
    neighborhood: a.neighborhood,
    stratum: a.stratum,
    city: a.city,
    location: a.location
      ? {
          latitud: a.location.latitud,
          longitud: a.location.longitud,
        }
      : undefined,
  };
}

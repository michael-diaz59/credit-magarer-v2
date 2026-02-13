import type { CostumerFormValues } from "../../../atomic_design/templates/costumers/SchemasCostumer";
import type { Customer } from "../domain/business/entities/Customer";


export class CostumerFormMapper {
  static toDomain(form: CostumerFormValues): Customer {
    return {
      id: crypto.randomUUID(),
      applicant: form.applicant,
      listId:form.listId?? "",
      coSigner: form.coSigner,
         observations: form.observations ?? "",
                    debtCounter:form.debtCounter ?? 0,
      vehicle: form.vehicle,
      familyReference: form.familyReference,
    };
  }
  static toForm(costumer: Customer): CostumerFormValues {
    return {
      debtCounter:costumer.debtCounter,
      observations:costumer.observations,
      id: costumer.id,
      listId:costumer.listId,
      applicant: costumer.applicant,
      coSigner: costumer.coSigner ?? [],
      vehicle: costumer.vehicle ?? [],
      familyReference: costumer.familyReference ?? [],
    };
  }
}

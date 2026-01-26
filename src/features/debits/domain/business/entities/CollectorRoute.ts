
/**ruta del cobrador */
export interface CollectorRoute {
  id: string;

  //id del debt
  debtId:string

  //id del clinete asociado a la deuda
  idCostumer: string

  collectorId: string; // cobrador

  //cuota asignada
  installmentId: string;

  //fecha de asignacion 
  assignedAt: string;

  //fecha de desasignacion, sirve para saber cuando hay un cambio de asignacion a un cobro
  unassignedAt?: string;
}

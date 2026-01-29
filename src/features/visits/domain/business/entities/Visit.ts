export default interface Visit {
  id: string;
  customerName: string;
  customerId:string
  customerDocument: string; // cédula
  custumerAddres: string;///direccion
  observations:string
  /**id del usuario asignado a la visita (advisor of field)*/
  userAssigned:string

  hasdebt:boolean


  
  /**deuda solicitado, esto es opcional*/
  debitId: string;

  /**monto de la deuda solicitada*/
  amountSolicited:number;


  /**fecha de creacion de visita*/
  createdAt: string; // yyyy-mm-dd

  state:StateVisit
}


//completado, pendiente
export type StateVisit =
    | { code: "completed" }
    | { code: "earring" }


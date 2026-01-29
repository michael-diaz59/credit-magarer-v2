export type DebtType =
  | 'credito'
  | 'prenda'

export type DebtStatus =
  | 'tentativa'
  | 'preparacion'
  | 'activa'
  | 'pagada'
  | 'en_mora'
  | 'cancelada';

  export type DebtTerms =
  | 'diario'
  | 'semanal'
  | 'quincenal'
  | 'mensual'

export interface Debt {
  id: string;

  collectorId: string

  type: DebtType;

  /**indica que la deuda esta relacionada con una visita, util para crear una deuda a la vez que una visita, una visita puede tener varias deudas */
  idVisit:string



  //para calcular cuanto paga el installment en base al interestRate y la frecuencia seleccionada para los pagos de las cuotas
  debtTerms:DebtTerms

  name:string

  status: DebtStatus;

  //id del costumer
  clientId: string;

  costumerName: string,

  costumerDocument:string;

  //total del prestamo pedido
  totalAmount: number;

  //numero de cuotas
  installmentCount: number;

  //tasa de interes
  interestRate: number;

  //fechas yyyy-mm-dd

  //fecha de inicio de prestamo, difiere de creacion ya que la creacion y la oficializacion pueden variar.
  startDate: string;

  //fecha de creacion de prestamo
  createdAt: string;

  //fecha de vencimiento
  firstDueDate: string
}

export type DebtType =
  | 'credito'
  | 'prenda'



  //cancelada: da por perdido un credito 
  //en_mora => credito vencido: una deuda que a paso de la fecha de vencimiento, esta deuda debe estar en un segmento de alerta
/** tentativa: cuando el asesor crea una deuda
 * preparacion: cuando el asesor envia una deuda al auditor
 * preAprobada: cuando el auditor envia una deuda al contador
 * activa: el contador da por desembolsada la deuda y el deudor pasa a deber a la empresa
 * pagada: el deudor pago al totalidad de la deuda
 * en_mora: la deuda tiene cuotas incompletas o en mora
 * cancelada: se perdio contacto y metodos de cobro al cliente(al dar por cancelada una deuda se da por cancelado todas las cuotas que esten en mora, las cuotas incompletas y pagadas sigen teniendo su estado)
*/
export type DebtStatus =
  | 'tentativa'
    | 'preparacion'
 | 'preAprobada'
  | 'activa'
  | 'corregir'
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

  /**numero de cuotas de una deuda*/
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

  //fecha del proximo pago que debe ser cancelado, si esta fecha es menor o igual a la fecha actual indica que la deuda esta en mora, si es valor esta vacio indica que la deuda fue pagada
  nextPaymentDue: string; 

  // NUEVO (Opcional): Cantidad de cuotas vencidas actualmente
  overdueInstallmentsCount: number;

}

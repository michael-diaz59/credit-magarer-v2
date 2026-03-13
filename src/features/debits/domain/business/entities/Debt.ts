export type DebtType = "credito" | "prenda";


// alert- despues de desembolsar no permitir modificar las deudas
//en_mora => credito vencido: una deuda que a paso de la fecha de vencimiento, esta deuda debe estar en un segmento de alerta
/** tentativa: cuando el asesor crea una deuda \
 * preAprobada : cuando el asesor envia una deuda al auditor \
 * preparacion: cuando el auditor envia una deuda al contador \
 * activa: el contador da por desembolsada la deuda y el deudor pasa a deber a la empresa \
 * pagada: el deudor pago al totalidad de la deuda \
 * en_mora: la deuda tiene cuotas incompletas o en mora \
 * inactivo: se perdio contacto y metodos de cobro al cliente(al dar por cancelada una deuda se da por cancelado todas las cuotas que esten en mora, las cuotas incompletas y pagadas sigen teniendo su estado) \
 * anulado: es una deuda que se creo en el sistema pero que por algun motivo se anula, implica que la empresa no perdio dinero y el cliente no fue mala paga-   colocar en gris las casillas
 */
export type DebtStatus =
  | "tentativa"
  | "preAprobada"
  | "preparacion"
  | "activa"
  | "corregir"
  | "pagada"
  | "en_mora"
  | "inactivo"
  | "anulado"

export const debtStatusList: DebtStatus[] = [
  "tentativa",
  "preAprobada",
  "preparacion",
  "activa",
  "corregir",
  "pagada",
  "en_mora",
  "inactivo",
  "anulado",
];

export type DebtTerms = "diario" | "semanal" | "quincenal" | "mensual";

/**con  installmentsPaid podemos saber cual es la siguiente cuota que debe ser cobrada*/
export interface Debt {
  id: string;

  collectorId: string;

  type: DebtType;

  /**indica que la deuda esta relacionada con una visita, util para crear una deuda a la vez que una visita, una visita puede tener varias deudas */
  idVisit: string;

  /**para calcular cuanto paga el installment en base al interestRate y la frecuencia seleccionada para los pagos de las cuotas */
  debtTerms: DebtTerms;

  name: string;

  /**representa el numero de dias que tiene un mes para esta deuda */
  diasMes: number,

  status: DebtStatus;



  /** total del capital prestado sin intereses */
  capital: number;

  /**total del prestamo pedido con intereses */
  totalAmount: number;


  /**total pagado hasta el momento por base de cuotas */
  totalPaid: number;

  /** total pagado por interes de mora de la deuda */
  totalPaymentForLate: number;

  /**tasa de interes */
  interestRate: number;

  //fechas yyyy-mm-dd

  /**fecha de inicio de prestamo, difiere de creacion ya que la creacion y la oficializacion pueden variar. */
  startDate: string;

  /**fecha de creacion de prestamo */
  createdAt: string;

  /**fecha de vencimiento */
  firstDueDate: string;




  /**numero de cuotas de una deuda*/
  installmentCount: number;



  /**fecha del proximo pago que debe ser cancelado, si esta fecha es menor o igual a la fecha actual indica que la deuda esta en mora, si es valor esta vacio indica que la deuda fue pagada */
  nextPaymentDue: string;

  /**fecha del ultimo pago */
  dateLastPayment: string;

  /**numero de cuotas pagadas en la totalidad de su base*/
  installmentsPaid: number;

  /**  Cantidad de cuotas vencidas actualmente */
  overdueInstallmentsCount: number;



  /**id del costumer */
  clientId: string;

  costumerName: string;

  costumerDocument: string;



  /** id de la deuda original en caso de ser una renovacion */
  originalDebt?: string;

  /** id de la nueva deuda que se creo como renovacion de esta */
  renewedToDebtId?: string;
}

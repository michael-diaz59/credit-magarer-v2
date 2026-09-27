export interface Route {
  id: string;
  /**nombre de la ruta */
  name: string;
  /**descripcion de la ruta */
  description: string;
  /** fechas formato YYYY-MM-DD*/
  startDisabled?: string;
  /** fecha fin del bloqueo de la ruta */
  endDisabled?: string;
  /**id de la compañia */
  companyId: string;
  /**id del cobrador asignado a la ruta*/
  collectorId?: string;
  /**nombre del cobrador asignado a la ruta*/
  collectorName?: string;

  /**capital que la ruta debe cobrar */
  capital: number;

  /**interes que la ruta debe cobrar */
  interest: number;

  /**valor de la ruta generado (capital + interes)*/
  amount: number;

  /**mora generada en la ruta*/
  arrears: number;

  /**dias de mora generados en la ruta*/
  arrearsDays: number;

  /**mora generada por aplazamiento formal en la ruta*/
  deferment: number;

  /**dias de mora por aplazamiento formal generados en la ruta*/
  defermentDays: number;

  /**total de la ruta (capital + interes + mora+ deferment)*/
  total: number;

  /**suma de todos los pagos en efectivo de esta ruta*/
  cashBalances: number;

  /**suma de todos los depositos de esta ruta*/
  depositBalances: number;

}

export const defaultRoute: Route = {
  id: "", // El repositorio generará uno si está vacío
  name: "",
  description: "",
  companyId: "",
  depositBalances: 0,
  cashBalances: 0,
  amount: 0,
  arrears: 0,
  arrearsDays: 0,
  capital: 0,
  deferment: 0,
  defermentDays: 0,
  interest: 0,
  total: 0,
};
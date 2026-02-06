export interface CollectorPayment {

  id:string

    
  collectorId: string;

  /**monto del pago a realizar a un cliente */
  amount: string;
  
  /**fecha de registro de pago desde contabilidad*/
  registresDate: string;

    /**fecha en la que se realizo el pago*/
  paymentDate: string;
}
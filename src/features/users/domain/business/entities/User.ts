export interface User {
  id: string;
  name: string
  email: string;
  companyId: string;
  roles: Role[]

  /**representa el dinero que pueda llegar a tener recolectado en fisico un cobrador */
  totalAmount?: number

  /**dinero que el cobrador debe por descuadre */
  totalDebt?: number

  /**
   * Rutas de cobro del collector. Solo se usa para usuarios con rol COLLECTOR.
   * Key: nombre de la ruta (ej: "Cali Sur")
   * Value: array de customerIds asignados a esa ruta
   */
  collectorRoutes?: Record<string, string[]>

  /** IDs de las rutas (Route) asignadas a este cobrador/usuario, se deberian limitar las rutas de un cobrador a max 10 */
  idRoutes?: string[];
}

export type Role = "ADMIN" | "OFFICE_ADVISOR" | "FIELD_ADVISOR" | "COLLECTOR" | "AUDITOR" | "ACCOUNTANT"
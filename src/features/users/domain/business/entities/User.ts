export interface User {
  id: string;
  name: string
  email: string;
  companyId: string;
  roles: Role[]

  /**representa el dinero que pueda llegar a tener recolectado en fisico un cobrador */
  totalAmount?: number

  /**
   * Rutas de cobro del collector. Solo se usa para usuarios con rol COLLECTOR.
   * Key: nombre de la ruta (ej: "Cali Sur")
   * Value: array de customerIds asignados a esa ruta
   */
  collectorRoutes?: Record<string, string[]>
}

export type Role = "ADMIN" | "OFFICE_ADVISOR" | "FIELD_ADVISOR" | "COLLECTOR" | "AUDITOR" | "ACCOUNTANT"
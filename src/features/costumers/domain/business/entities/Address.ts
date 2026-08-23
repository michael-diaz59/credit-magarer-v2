/**
 * representa la direccion de la casa del cliente
 */
export interface Address {
  /**direcion de la casa del cliente */
  address: string;
  /**barrio de la casa del cliente */
  neighborhood: string;
  /**estrato de la casa del cliente */
  stratum: number;
  /**ciudad de la casa del cliente */
  city: string;
  /**ubicacion de la casa del cliente */
  locationGPS?: LocationGPS
}

/**
 * representa una ubicacion geografica con coordenadas 
 */
export interface LocationGPS {
  /**coordenadas de la ubicacion de la casa del cliente */
  coordinates?: string;
  /**latitud de la ubicacion de la casa del cliente */
  latitude?: number;
  /**longitud de la ubicacion de la casa del cliente */
  longitude?: number;
  /**precision de la ubicacion de la casa del cliente con un radio en metros */
  accuracy?: number;

  /**fuente de la ubicacion de la casa del cliente
   * GPS 
   * MANUAL
   */
  provider?: string
}


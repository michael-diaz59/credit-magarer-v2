export interface Address {
  //direccion
  address: string;

  //barrio
  neighborhood: string;
  //estrato
  stratum: number;
  //ciudad
  city: string;

  //ubicacion
  location?:LocationA
}

export interface LocationA {
    coordenadas?: string;
    latitud?: number;
    longitud?:number;
}


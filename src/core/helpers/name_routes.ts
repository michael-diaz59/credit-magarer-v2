export type RoutNav = {
  label: string;
  path: string;
};

export const baseAppBar: RoutNav[] = [
  { label: "ligas", path: "/league" },
  { label: "torneos", path: "/tournament" },
  { label: "participantes", path: "/participants" },
   { label: "configuracion", path: "/configuration" },
];

export const saleAppBar: RoutNav[] = [
  { label: "clientes", path: "/costumer" },
  { label: "desembolsos", path: "/disburstment" },
  { label: "visitas", path: "/visits" },
   { label: "inicio", path: "/" },
];

export const nameRoutesMap = new Map([
  ["/league", "ligas"],
  ["/tournament", "torneos"],
  ["/participants", "participantes"],
  ["/configuration", "configuracion"],
]);
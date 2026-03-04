export default function FormatNumberToMoney (value: number | undefined): string {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat("es-CO").format(value);
};
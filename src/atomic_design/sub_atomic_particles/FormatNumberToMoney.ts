export default function FormatNumberToMoney(value: number | undefined): string {
  if (value === undefined || value === null) return "0";
  try {
    return new Intl.NumberFormat("es-CO").format(value);
  } catch (error) {
    console.error("Error formatting number to money:", error);
    return "0";
  }
};
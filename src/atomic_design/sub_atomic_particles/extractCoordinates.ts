export function extractCoordinates(input: string): string | null {
  if (!input) return null;

  const text = input.trim();

  // ✅ Caso 1: ya son coordenadas
  const coordRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
  if (coordRegex.test(text)) {
    return text.replace(/\s+/g, "");
  }

  return null;
}
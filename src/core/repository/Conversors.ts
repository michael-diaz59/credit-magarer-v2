export function extraerNumeroDeString(texto: string): number {
    // La RegEx /\d+/g busca secuencias de uno o más números en el texto
    const coincidencias = texto.match(/\d+/);

    // Si encuentra números, los une y los convierte a tipo 'number'
    if (coincidencias) {
        return Number(coincidencias[0]);
    }

    // Si el string no tenía ningún número (ej: "credit-none"), devuelve null
    return 0;
}
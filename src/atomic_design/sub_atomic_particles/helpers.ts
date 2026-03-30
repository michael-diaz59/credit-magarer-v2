/**
 * mezcla un objeto el cual al tener un valor undefined en alguna propiedad, no toma en cuenta la propiedad
 *
 * Es útil para formularios donde existen valores por defecto
 * y se quieren aplicar valores iniciales sin perder defaults
 * cuando alguna propiedad viene undefined.
 *
 * Ejemplo:
 * mergeDefined(
 *   { a: 1, b: 2 },
 *   { a: 10, b: undefined }
 * )
 * Resultado:
 *   { a: 10, b: 2 }
 *
 * Se usa mucho para:
 * - defaultValues en formularios
 * - configuración parcial
 * - actualización de entidades
 */
export function mergeDefined<T>(base: T, override?: Partial<T>): T {
    if (!override) return base;

    const result = { ...base };

    for (const key of Object.keys(override) as (keyof T)[]) {
        const value = override[key];
        if (value !== undefined) {
            result[key] = value;
        }
    }

    return result;
}

export const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
/**indica si hay o no que pagar algun tipo de mora para marcar en automatico como pagada 
 * no: no se paga mora
 * aplazamiento: si se paga mora por aplazamiento
 * total: se debe pagar todos los tipos de mora
*/
export type requiredArrearsState = "no" | "aplazamiento" | "total";
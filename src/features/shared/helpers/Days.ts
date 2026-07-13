5/**
 * verifica si el año es bisiesto
 * @param year año
 * @returns true si el año es bisiesto
 */
export function isYearLeap(year: number): boolean {
    if (year % 400 === 0) {
        return true;
    } else if (year % 100 === 0) {
        return false
    }
    if (year % 4 === 0) {
        return true;
    }
    return false;
}

export type diasPorTerminoSimple = "diario" | "semanal";


/**
 *  esta funcion sirve para obtener el dia siguiente de forma directa contando dias hacia adelante siendo 1 para diario y 7 para semanal
 * @param fechaActual
 * @returns 
 */
export function obtenerDiaSimple(fecha: Date, termino: diasPorTerminoSimple): Date {

    const diasPorTermino: Record<diasPorTerminoSimple, number> = {
        diario: 1,
        semanal: 7,
    };

    const dias: number = diasPorTermino[termino];

    // 1. Creamos una copia de la fecha para evitar modificar la original
    const nuevaFecha = new Date(fecha.getTime());

    // 2. Le sumamos exactamente 7 días
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    return nuevaFecha;
}

export function obtenerDiaSiguienteQuincena(fecha: Date, dayIn: number): { date: Date, nextDay: number } {
    let nextDay = dayIn;
    console.log("nextDay", nextDay)
    const diaActual = nextDay;
    const mesActual = fecha.getMonth();
    const anioActual = fecha.getFullYear();

    let nuevaFecha = new Date(anioActual, mesActual, diaActual);

    let lapso = 15;

    // 1. Si el día es del 1 al 15, sumamos 15 días
    if (diaActual <= lapso) {
        nuevaFecha.setDate(diaActual + lapso);

        // CORRECCIÓN DINÁMICA: Se adapta a 28, 29, 30 o 31 días según el mes
        const ultimoDiaMes = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0).getDate();
        if (nuevaFecha.getDate() > ultimoDiaMes) {
            nuevaFecha.setDate(ultimoDiaMes);
        }
    }
    // 2. Si el día es del 16 en adelante, pasa al mes siguiente
    else {
        const proximoMes = mesActual + 1;
        const diasDelProximoMes = new Date(anioActual, proximoMes + 1, 0).getDate();

        if (diaActual === 31) {
            nuevaFecha = new Date(anioActual, proximoMes, diasDelProximoMes);
        } else {
            let nuevoDia = diaActual - lapso;

            // Aquí también aplicamos el tope dinámico para el mes siguiente
            if (nuevoDia > diasDelProximoMes) {
                nuevoDia = diasDelProximoMes;
            }

            nuevaFecha = new Date(anioActual, proximoMes, nuevoDia);
        }
    }
    if (dayIn > 15) {
        nextDay = dayIn - 15;
    } else {
        nextDay = dayIn + 15;
    }

    return { date: nuevaFecha, nextDay };
}



export function obtenerDiaMesSiguiente(anio: number, mes: number, diaDeseado: number): Date {
    // En JavaScript, el día 0 del mes siguiente representa el ULTIMO día del mes actual.
    // Ej: new Date(2027, 2, 0) -> mes 2 es Marzo, día 0 nos da el último día de Febrero (28).
    console.log("diaDeseado", diaDeseado)
    console.log("mes", mes + 1)
    console.log("anio", anio)
    //se pone +2 por que al pasarle 0 como dia realmente me retorna el dia anteriro al pirmer dia dle mes actual (osea el ultimo dia del mes anterior)
    //yo necesito el ultimo dia del mes actual, por eso le resto 1 (pasando de +1 a +2)
    const newDateTest = new Date(anio, mes + 2, 0)
    console.log("DateTest", newDateTest.toISOString())
    const maximoDiasEnMes = newDateTest.getDate();
    console.log("maximoDiasEnMes:" + maximoDiasEnMes)
    let newDay: number;
    let newDate: Date;




    // Si el día que queremos es mayor al que el mes permite, devolvemos el más cercano (el máximo del mes)
    if (diaDeseado > maximoDiasEnMes) {
        newDay = maximoDiasEnMes;
    } else {
        newDay = diaDeseado;
    }
    newDate = new Date(anio, mes + 1, newDay);
    console.log("newDate", newDate.toISOString())
    return newDate;
}
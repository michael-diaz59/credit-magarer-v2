// --- HELPER PARA FORMATEAR FECHAS EN LOCAL (Evita errores de zona horaria con ISO) ---
function obtenerKeyFechaLocal(date: Date): string {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

// --- ALGORITMO DE PASCUA Y LEY EMILIANI POR AÑO ---
function obtenerSiguienteLunes(fecha: Date): Date {
    const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes...
    if (diaSemana === 1) return fecha;
    const diasFaltantes = diaSemana === 0 ? 1 : 8 - diaSemana;
    fecha.setDate(fecha.getDate() + diasFaltantes);
    return fecha;
}

function calcularFestivosColombia(anio: number): Set<string> {
    const festivos = new Set<string>();

    // 1. Festivos Fijos (Inamovibles)
    const fijos = ["01-01", "05-01", "07-20", "08-07", "12-08", "12-25"];
    fijos.forEach(f => festivos.add(`${anio}-${f}`));

    // 2. Festivos de Fecha Fija pero trasladados a Lunes (Ley Emiliani)
    const trasladables = [
        new Date(anio, 0, 6),   // Reyes Magos: 6 Ene
        new Date(anio, 2, 19),  // San José: 19 Mar
        new Date(anio, 5, 29),  // San Pedro y San Pablo: 29 Jun
        new Date(anio, 7, 13),  //  nuestra señora del rosario de chiquinquirá 
        new Date(anio, 7, 15),  // Asunción de la Virgen: 15 Ago
        new Date(anio, 9, 12),  // Día de la Raza: 12 Oct
        new Date(anio, 10, 1),  // Todos los Santos: 1 Nov
        new Date(anio, 10, 11)  // Independencia de Cartagena: 11 Nov
    ];
    trasladables.forEach(f => {
        const lunesFestivo = obtenerSiguienteLunes(f);
        festivos.add(obtenerKeyFechaLocal(lunesFestivo));
    });

    // 3. Cálculo del Domingo de Pascua (Spencer Jones)
    const a = anio % 19; const b = Math.floor(anio / 100); const c = anio % 100;
    const d = Math.floor(b / 4); const e = b % 4;
    const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4); const k = c % 4;
    const L = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 2 * L) / 451);
    const mesPascua = Math.floor((h + L - 7 * m + 114) / 31);
    const diaPascua = 1 + ((h + L - 7 * m + 114) % 31);

    const pascua = new Date(anio, mesPascua - 1, diaPascua);

    // 4. Festivos dependientes de la Pascua
    const diasDesdePascua = [-3, -2, 43, 64, 71]; // Jueves Santo, Viernes Santo, Ascensión, Corpus, Sagrado Corazón
    diasDesdePascua.forEach(dias => {
        const fechaFestivo = new Date(pascua);
        fechaFestivo.setDate(pascua.getDate() + dias);
        festivos.add(obtenerKeyFechaLocal(fechaFestivo));
    });

    return festivos;
}

// --- CACHE DE FESTIVOS ---
// Evita volver a calcular todos los festivos si evaluamos varias fechas del mismo año en ejecuciones continuas
const cacheFestivosPorAnio: Record<number, Set<string>> = {};

/**
 * Verifica si una fecha es valida (no es domingo ni festivo), en caso de no ser valida devuelve la fecha mas cercana hacia el futuro que lo sea
 * @param date fecha a validar
 * @returns fecha valida
 */
export function getValidDueDate(date: Date): Date {
    // Clonamos la fecha original para no mutar el parámetro recibido
    let validDate = new Date(date.getTime());

    while (true) {
        const isSunday = validDate.getDay() === 0;
        const anioActual = validDate.getFullYear();

        // Si no tenemos los festivos de este año en memoria, los calculamos una sola vez
        if (!cacheFestivosPorAnio[anioActual]) {
            cacheFestivosPorAnio[anioActual] = calcularFestivosColombia(anioActual);
        }

        const dateStr = obtenerKeyFechaLocal(validDate);
        const isHoliday = cacheFestivosPorAnio[anioActual].has(dateStr);

        if (isSunday || isHoliday) {
            // Sumamos 1 día directamente usando la API nativa de JS de forma segura
            validDate.setDate(validDate.getDate() + 1);
        } else {
            break;
        }
    }

    return validDate;
}
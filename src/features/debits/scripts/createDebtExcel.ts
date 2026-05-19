import * as XLSX from "xlsx";
import { createBasicDebt, type Debt, type DebtStatus, type DebtTerms } from "../domain/business/entities/Debt";
import { FirebaseCostumerRepository } from "../../costumers/repository/FirebaseCostumerRepository";



export interface ImportDebtFromExcelConfig {
    companyId: string;
    collectorId: string;
    idRoute: string;
}

export async function importDebtFromExcel(
    file: File,
    config: ImportDebtFromExcelConfig
) {
    const arrayBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
        type: "array",
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Usa JSON_EXT_DATE para leer fechas correctamente
    const jsonData = XLSX.utils.sheet_to_json<any>(sheet, {
        header: 1,
        raw: true,
    });

    if (!jsonData || jsonData.length < 2) {
        throw new Error("El archivo Excel está vacío o no tiene datos válidos.");
    }

    const firebaseCostumerRepository = new FirebaseCostumerRepository();

    let customers: Map<string, string> | null

    customers = new Map<string, string>();

    /** 
    customers= await firebaseCostumerRepository.getMasiveCostumerByIdNumber({
        companyId: config.companyId,
    })
        */

    if (!customers) {
        throw new Error("No se encontraron clientes para la empresa");
    }

    const rows = jsonData.slice(1) as any[][];

    var debts: Debt[] = [];



    console.log(`Iniciando importación de ${rows.length} deudas.`);

    // Crear fecha actual
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    for (const row of rows) {
        try {
            const document = String(row[15]);

            if (!document) continue;

            const clientId = customers.get(document);

            if (!clientId) {

                console.error(`Cliente no encontrado para la cédula ${document}`);
                //continue;
            }

            // Extraer datos de la fila
            const capital = Number(row[4]) || 0;
            const interestRate = Number(row[6]) || 0;
            const debtTerms: DebtTerms = mapDebtTerms(String(row[5] || ""));
            const totalInterest = Number(row[18]) || 0;
            const papeleria = Number(row[14]) || 0;
            const totalAmount = capital + totalInterest;
            const installmentCount = Number(row[17]) || 0;
            const costumerName = String(row[2]) || "";
            const startDate = excelDateToISO(Number(row[3]));
            const status = mapDebtStatus(String(row[11]) || "");

            // Validar que los números sean válidos
            if (isNaN(capital) || isNaN(interestRate) || isNaN(totalInterest) || isNaN(totalAmount)) {
                console.warn(`Fila con valores numéricos inválidos:`, row);
                continue;
            }

            // Crear la deuda
            const debt: Debt = {
                ...createBasicDebt(),
                creditPaid: 0,
                capitalPaid: 0,
                interestPaid: 0,
                routeId: config.idRoute,
                type: "credito",
                idVisit: "",
                delivered: true,
                status: status,

                debtTerms,

                name: "",

                capital,

                totalInterest,

                totalAmount,

                remainingToCompleteCredit: totalAmount,

                interestRate,

                papeleria: papeleria,

                startDate: startDate,

                createdAt: today,

                firstDueDate: today,

                nextPaymentDue: today,

                installmentCount: installmentCount,

                clientId: clientId || "cedula no encontrada en excel",

                costumerName: costumerName,

                costumerDocument: document,
            };

            debts.push(debt);

            console.log(
                `Crédito importado correctamente para ${document}`
            );
        } catch (error) {
            console.error("Error importando fila", row, error);
        }
    }

    console.log("deudas", debts);
}

function mapDebtStatus(value: string): DebtStatus {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
        case "":
            return "activa";

        case "finalizado":
            return "pagada";

        case "si":
            return "pagada";

        default:
            return "activa";
    }
}

function mapDebtTerms(value: string): DebtTerms {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
        case "diario":
            return "diario";

        case "semanal":
            return "semanal";

        case "quincenal":
            return "quincenal";

        case "mensual":
            return "mensual";

        default:
            return "diario";
    }
}

function excelDateToISO(excelDate: number): string {
    // Excel empieza desde 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));

    const result = new Date(
        excelEpoch.getTime() + excelDate * 86400000
    );

    return result.toISOString().slice(0, 10);
}
import * as XLSX from "xlsx";
import { createBasicDebt, type Debt, type DebtStatus, type DebtTerms } from "../domain/business/entities/Debt";
import { FirebaseCostumerRepository } from "../../costumers/repository/FirebaseCostumerRepository";
import { CreateDebtFromExcelCase } from "../domain/business/useCases/debt/createDebtFromExcel";
import { FirebaseDebtRepository } from "../provider/firebase/DebtRepository";
import { diasPorTermino } from "../../../core/helpers/debts/diasPorTermino";
import { addDays, descontarMonto, calcularCuotasPagadas } from "../domain/business/useCases/helper";
import type { Installment, InstallmentStatus } from "../domain/business/entities/Installment";
import type { Customer } from "../../costumers/domain/business/entities/Customer";
import { FirebaseInstallmentRepository } from "../provider/firebase/FirebaseInstallmentRepository";
import { FirebasePaymentRepository } from "../provider/firebase/FirebasePaymentRepository";
import type { Payment } from "../domain/business/entities/Payment";
import { collection, getDocs, type DocumentData } from "firebase/firestore";
import { firestore } from "../../../store/firebase/firebase";
import { decodeDate } from "../../shared/firebase/codeDecodeTime";
import { paidPorcential } from "../../shared/helpers/calculate";
import { getValidDueDate } from "../../shared/helpers/calcularFestivosColombia";



export interface ImportDebtFromExcelConfig {
    companyId: string;
    collectorId: string;
    idRoute: string;
}


export async function buscarCreditoMalo(
    _: File,
    config: ImportDebtFromExcelConfig
) {
    const firebaseDebtRepository = new FirebaseDebtRepository();

    await firebaseDebtRepository.updateAllDebts(config.companyId)
}



export async function corregirCreditos(
    _: File,
    config: ImportDebtFromExcelConfig
) {
    const firebaseDebtRepository = new FirebaseDebtRepository();

    await firebaseDebtRepository.updateAllDebts(config.companyId)
}

export function calculateDatesOfDebts(debt: Debt) {

    console.log("debt", debt);

    debt.totalInterest = debt.capital * (debt.interestRate / 100);

    debt.totalAmount = debt.capital + debt.totalInterest;

    debt.interestPaid = paidPorcential(debt.totalPaid + debt.renewalPayment, debt.totalInterest);

    debt.capitalPaid = paidPorcential(debt.totalPaid + debt.renewalPayment, debt.capital);

    debt.totalPaymentForLate = 0

    debt.remainingToCompleteCredit = debt.totalAmount - (debt.totalPaid + debt.renewalPayment);

    debt.creditPaid = paidPorcential(debt.totalPaid + debt.renewalPayment, debt.totalAmount);


}

export async function importDebtFromExcel4(
    _: File,
    config: ImportDebtFromExcelConfig
) {
    const firebaseDebtRepository = new FirebaseDebtRepository();

    const result = await firebaseDebtRepository.migrateDeliveredStatus(config.companyId)
    if (!result) return;

}

export async function importDebtFromExcel3(
    _: File,
    config: ImportDebtFromExcelConfig
) {
    await migratePaymentsFromInstallments(config);

}
export async function importDebtFromExcel2(
    _: File,
    config: ImportDebtFromExcelConfig
) {
    const firebaseDebtRepository = new FirebaseDebtRepository();
    await firebaseDebtRepository.migrateDeliveredStatus(config.companyId)

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

    if (!jsonData || jsonData.length < 1) {
        throw new Error("El archivo Excel está vacío o no tiene datos válidos.");
    }

    const firebaseCostumerRepository = new FirebaseCostumerRepository();
    const firebaseDebtRepository = new FirebaseDebtRepository();
    const createDebtFromExcelCase = new CreateDebtFromExcelCase(firebaseDebtRepository)




    let customers: Map<string, Customer> | null

    customers = new Map<string, Customer>();

    customers = await firebaseCostumerRepository.getMasiveCostumerByIdNumber({
        companyId: config.companyId,
    })
    console.log("clientes", customers);


    if (!customers) {
        throw new Error("No se encontraron clientes para la empresa");
    }

    const rows = jsonData as any[][];

    var debts: Debt[] = [];



    console.log(`Iniciando importación de ${rows.length} deudas.`);

    // Crear fecha actual
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    for (const row of rows) {
        try {
            const document = String(row[15]);

            if (!document) continue;

            const cursatomersForDocument = customers.get(document);

            if (!cursatomersForDocument) {

                console.error(`Cliente no encontrado para la cédula ${document}`);
                //continue;
            } else {
                console.log("cliente encontrado", cursatomersForDocument);
            }

            // Extraer datos de la fila
            const capital = Number(row[4]) || 0;
            const interestRate = Number(row[6]) * 100 || 0;
            const debtTerms: DebtTerms = mapDebtTerms(String(row[5] || ""));
            const totalInterest = capital * (interestRate / 100)
            const papeleria = Number(row[14]) || 0;
            const totalAmount = capital + totalInterest;
            const installmentCount = Number(row[17]) || 0;
            const costumerName = String(row[2]) || "";
            const startDate = excelDateToISO(Number(row[3]));
            const status = mapDebtStatus(String(row[11]) || "");
            const totalPaid = Number(row[7]) || 0;
            const renewalPayment = Number(row[12]) || 0;

            // Validar que los números sean válidos
            if (isNaN(capital) || isNaN(interestRate) || isNaN(totalInterest) || isNaN(totalAmount)) {
                console.warn(`Fila con valores numéricos inválidos:`, row);
                continue;
            }

            // Crear la deuda
            const debt: Debt = {
                ...createBasicDebt(),
                capital: capital,
                totalInterest: totalInterest,
                //mora
                totalPaymentForLate: 0,


                totalAmount: totalAmount,
                totalPaid: totalPaid,

                renewalPayment: renewalPayment,
                remainingToCompleteCredit: totalAmount - (totalPaid + renewalPayment),
                creditPaid: paidPorcential(totalPaid + renewalPayment, capital + totalInterest),
                installmentsPaid: calcularCuotasPagadas(totalPaid + renewalPayment, totalAmount, installmentCount),
                capitalPaid: paidPorcential(totalPaid + renewalPayment, capital),
                interestPaid: paidPorcential(totalPaid + renewalPayment, totalInterest),
                routeId: config.idRoute,
                type: "fijo",
                idVisit: "",
                delivered: true,
                deliveredStatus: "entregado",
                status: status,

                debtTerms,

                name: "",

                interestRate: interestRate,

                papeleria: papeleria,

                startDate: startDate,

                createdAt: today,

                firstDueDate: today,

                nextPaymentDue: today,

                installmentCount: installmentCount,

                clientId: cursatomersForDocument?.id || "cedula no encontrada en excel",

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
    await createDebtFromExcelCase.execute({
        companyId: config.companyId,
        debts: debts
    })
    console.log("deudas creadas", debts);

    //generar y cargar los installments y pagos
    await createInstallments(debts, config.companyId, customers, config.collectorId);


    calcularCounterDebtsToCostumeres(debts, customers);


    const customersArray: Customer[] = []

    for (const customer of customers.values()) {
        customersArray.push(customer);
    }

    firebaseCostumerRepository.updateCustomersDebtCounter({
        companyId: config.companyId,
        customers: customersArray
    }
    )







}

function calcularCounterDebtsToCostumeres(debts: Debt[], costumers: Map<string, Customer>) {

    for (const debt of debts) {
        const costumer = costumers.get(debt.costumerDocument);
        if (costumer && debt.status === "pagada") {
            costumer.debtCounter++;
        }
    }
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




async function createInstallments(
    debts: Debt[],
    companyId: string,
    costumers: Map<string, Customer>,
    collectorId: string
) {
    const installments: Installment[] = [];
    const payments: Payment[] = [];

    for (const debt of debts) {
        const costumer = costumers.get(debt.costumerDocument);
        const [year, month, day] = debt.startDate.split("-").map(Number);
        const start = new Date(year, month - 1, day);
        console.log("start date:", start);
        const stepDays = diasPorTermino[debt.debtTerms];
        console.log("stepDays:", stepDays);

        let pagado = debt.totalPaid + debt.renewalPayment;
        const installmentAmount = debt.totalAmount / debt.installmentCount;

        for (let i = 0; i < debt.installmentCount; i++) {
            const rawDueDate = addDays(start, stepDays * (i + 1));
            const dueDate = getValidDueDate(rawDueDate);

            const { restado, restante } = descontarMonto(pagado, installmentAmount);
            pagado = restante;
            let status: InstallmentStatus = "pendiente";
            if (restado >= installmentAmount) {
                status = "pagada";
            } else if (restado > 0) {
                status = "incompleto";
            }



            installments.push({
                installmentTotalNumber: debt.installmentCount,
                paidAmount: restado,
                paidAt: restado >= installmentAmount ? new Date().toISOString().slice(0, 10) : "",
                costumerNumber: costumer?.applicant.phone || "",
                payments: [],
                basePaidRatio: paidPorcential(restado, installmentAmount),
                latePaidRatio: 100,
                lateDueDate: "",
                lateInterestRate: 0,
                aplazado: false,
                latepayment: 0,
                routeId: debt.routeId,
                paidLatePayment: 0,
                companyId: companyId,
                id: "",
                debtId: debt.id,
                costumerId: costumer?.id || "",
                costumerDocument: debt.costumerDocument,
                costumerName: debt.costumerName,
                costumerAddres: {
                    address: costumer?.applicant.address?.address || "",
                    neighborhood: costumer?.applicant.address?.neighborhood || "",
                    stratum: costumer?.applicant.address?.stratum || 0,
                    city: costumer?.applicant.address?.city || "",
                },
                installmentNumber: i + 1,
                interestRate: debt.interestRate,
                amount: installmentAmount,
                dueDate: dueDate.toISOString().slice(0, 10),
                status: status,
                createdAt: new Date().toISOString().slice(0, 10),
            });

            if (restado > 0) {

                payments.push({
                    debtId: debt.id,
                    idProofOfPayment: "",
                    id: "",
                    idRoute: debt.routeId,
                    isTight: true,
                    collectorObservation: "Pago migrado de Excel",
                    accountantObservation: "Confirmado desde migración masiva",
                    installmentId: i.toString(),
                    costumerName: debt.costumerName,
                    collectorName: "Sistema",
                    collectorId: collectorId,
                    amount: restado,
                    method: "efectivo",
                    status: "confirmado",
                    paidAt: new Date().toISOString().slice(0, 10)
                });
            }
        }
    }

    const firebaseInstallmentRepository = new FirebaseInstallmentRepository();
    await firebaseInstallmentRepository.createMany({
        companyId: companyId,
        installments: installments
    });
    console.log("cuotas creadas", installments);

    const paymentsList: Payment[] = [];

    for (const payment of payments) {
        payment.installmentId = installments[Number(payment.installmentId)].id;
        console.log("id", payment.installmentId);
        paymentsList.push(payment);
    }

    if (paymentsList.length > 0) {
        const firebasePaymentRepository = new FirebasePaymentRepository();
        await firebasePaymentRepository.createMany({
            companyId: companyId,
            payments: paymentsList
        });
    }
    console.log("pagos creados", paymentsList);
}

async function migratePaymentsFromInstallments(input: {
    companyId: string;
    collectorId: string;
    idRoute: string
}) {
    try {

        console.log(
            "Iniciando migración de payments..."
        );

        /* =======================================================
           1. OBTENER TODOS LOS INSTALLMENTS
        ======================================================= */

        const installmentsRef = collection(
            firestore,
            "companies",
            input.companyId,
            "installments"
        );

        const installmentsSnap = await getDocs(
            installmentsRef
        );

        console.log(
            `Installments encontrados: ${installmentsSnap.size}`
        );


        /* =======================================================
           3. CREAR PAYMENTS
        ======================================================= */

        const payments: Payment[] = [];

        let processed = 0;
        let skipped = 0;

        installmentsSnap.forEach((docSnap) => {

            try {

                const raw = docSnap.data();

                const installment =
                    DocumentToInstallment(
                        docSnap.id,
                        raw
                    );

                // Ignorar cuotas sin pago
                if (
                    !installment.paidAmount ||
                    installment.paidAmount <= 0
                ) {
                    skipped++;
                    return;
                }


                const payment: Payment = {
                    debtId: installment.debtId,
                    idProofOfPayment: "",
                    id: "",

                    idRoute: input.idRoute,

                    isTight: true,

                    collectorObservation:
                        "Pago migrado de Excel",

                    accountantObservation:
                        "Confirmado desde migración masiva",

                    installmentId:
                        installment.id,

                    costumerName:
                        installment.costumerName,

                    collectorName: "Sistema",

                    collectorId:
                        input.collectorId,

                    amount:
                        installment.paidAmount,

                    method: "efectivo",

                    status: "confirmado",

                    paidAt:
                        new Date()
                            .toISOString()
                            .slice(0, 10),
                };

                payments.push(payment);

                processed++;

                if (processed % 1000 === 0) {
                    console.log(
                        `${processed} payments preparados`
                    );
                }

            } catch (error) {

                console.error(
                    "Error procesando installment",
                    docSnap.id,
                    error
                );

                skipped++;
            }
        });

        console.log(
            `Payments preparados: ${payments.length}`
        );

        console.log(
            `Installments ignorados: ${skipped}`
        );
        return;

        /* =======================================================
           4. GUARDAR PAYMENTS
        ======================================================= 

       
            const paymentRepository =
            new FirebasePaymentRepository();

        const result =
            await paymentRepository.createMany({
                companyId: input.companyId,
                payments,
            });

        if (!result.ok) {

            console.error(
                "Error guardando payments",
                result.error
            );

            return;
        }

        console.log(
            "Migración completada correctamente"
        );
        */

    } catch (error) {

        console.error(
            "Error en migración masiva",
            error
        );
    }
}




function DocumentToInstallment(id: string, data: DocumentData): Installment {
    return {
        id,
        basePaidRatio: data.basePaidRatio ?? 0,
        latePaidRatio: data.latePaidRatio ?? 0,
        companyId: data.companyId ?? "",
        debtId: data.debtId ?? "",
        interestRate: data.interestRate ?? 0,
        lateInterestRate: data.lateInterestRate ?? 0,
        routeId: data.routeId ?? "",
        costumerId: data.costumerId ?? "",
        costumerDocument: data.costumerDocument ?? "",
        costumerName: data.costumerName ?? "",
        costumerNumber: data.costumerNumber ?? "",

        costumerAddres: {
            address: data.costumerAddres?.address ?? "",
            neighborhood: data.costumerAddres?.neighborhood ?? "",
            stratum: data.costumerAddres?.stratum ?? 0,
            city: data.costumerAddres?.city ?? "",
        },
        managed: data.managed ?? false,
        managementDate: data.managementDate ? decodeDate(data.managementDate) : "",

        attemptedCollection: data.attemptedCollection ?? false,
        dateAttemptedPayment: data.dateAttemptedPayment ? decodeDate(data.dateAttemptedPayment) : "",
        descriptionAttemptedPayment: data.descriptionAttemptedPayment ?? "",
        locationAttemptedPayment: data.locationAttemptedPayment,

        installmentTotalNumber: data.installmentTotalNumber ?? 0,
        installmentNumber: data.installmentNumber ?? 0,
        amount: data.amount ?? 0,
        paidAmount: data.paidAmount ?? 0,
        latepayment: data.latepayment ?? 0,
        dueDate: data.dueDate ? decodeDate(data.dueDate) : "",
        lateDueDate: data.lateDueDate ? decodeDate(data.lateDueDate) : "",
        status: data.status ?? "pendiente",
        paidAt: data.paidAt ? decodeDate(data.paidAt) : "",
        createdAt: data.createdAt ? decodeDate(data.createdAt) : "",
        payments: data.payments ?? [],
        paidLatePayment: data.paidLatePayment ?? 0,
        aplazado: data.aplazado ?? false,
    };
}
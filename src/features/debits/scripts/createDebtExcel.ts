import * as XLSX from "xlsx";
import { createEmptyDebt, type Debt, type DebtStatus, type DebtTerms } from "../domain/business/entities/Debt";
import { FirebaseCostumerRepository } from "../../costumers/repository/FirebaseCostumerRepository";
import { CreateDebtFromExcelCase } from "../domain/business/useCases/debt/createDebtFromExcel";
import { FirebaseDebtRepository } from "../provider/firebase/DebtRepository";
import { diasPorTermino } from "../../../core/helpers/debts/diasPorTermino";
import { addDays, descontarMonto, calcularCuotasPagadas } from "../domain/business/useCases/helper";
import { defaultInstallment, type Installment, type InstallmentStatus } from "../domain/business/entities/Installment";
import type { Customer } from "../../costumers/domain/business/entities/Customer";
import { DocumentToInstallment, FirebaseInstallmentRepository } from "../provider/firebase/FirebaseInstallmentRepository";
import { FirebasePaymentRepository } from "../provider/firebase/FirebasePaymentRepository";
import { emptyPayment, type Payment } from "../domain/business/entities/Payment";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../../store/firebase/firebase";
import { paidPorcential } from "../../../core/shared/helpers/calculate";
import { getValidDueDate } from "../../../core/shared/helpers/calcularFestivosColombia";



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

    debt.interest = debt.capital * (debt.interestRate / 100);

    debt.amount = debt.capital + debt.interest;

    debt.percentageOfInteresPaid = paidPorcential(debt.amountPaid + debt.renewalPayment, debt.interest);

    debt.percentageOfCapitalPaid = paidPorcential(debt.amountPaid + debt.renewalPayment, debt.capital);

    debt.arrearsPaid = 0

    debt.remainingAmountToPay = debt.amount - (debt.amountPaid + debt.renewalPayment);

    debt.percentageOfAmountPaid = paidPorcential(debt.amountPaid + debt.renewalPayment, debt.amount);


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
                ...createEmptyDebt(),
                capital: capital,
                interest: totalInterest,
                //mora
                arrearsPaid: 0,


                amount: totalAmount,
                amountPaid: totalPaid,

                renewalPayment: renewalPayment,
                remainingAmountToPay: totalAmount - (totalPaid + renewalPayment),
                percentageOfAmountPaid: paidPorcential(totalPaid + renewalPayment, capital + totalInterest),
                installmentsPaid: calcularCuotasPagadas(totalPaid + renewalPayment, totalAmount, installmentCount),
                percentageOfCapitalPaid: paidPorcential(totalPaid + renewalPayment, capital),
                percentageOfInteresPaid: paidPorcential(totalPaid + renewalPayment, totalInterest),
                routeId: config.idRoute,
                type: "fijo",
                idVisit: "",
                delivered: true,
                deliveredStatus: "entregado",
                status: status,

                debtTerms,

                name: "",

                interestRate: interestRate,

                processingFee: papeleria,

                startDate: startDate,

                createdAt: today,

                nextPaymentDue: today,

                installmentCount: installmentCount,

                clientId: cursatomersForDocument?.id || "cedula no encontrada en excel",

                clientName: costumerName,

                clientDocument: document,
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
        const costumer = costumers.get(debt.clientDocument);
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
        const costumer = costumers.get(debt.clientDocument);
        const [year, month, day] = debt.startDate.split("-").map(Number);
        const start = new Date(year, month - 1, day);
        console.log("start date:", start);
        const stepDays = diasPorTermino[debt.debtTerms];
        console.log("stepDays:", stepDays);

        let pagado = debt.amountPaid + debt.renewalPayment;
        const installmentAmount = debt.amount / debt.installmentCount;

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

            const capitalPerInstallment = debt.capital / debt.installmentCount;
            let capitalToInstallment: number;
            let interesToInstallment: number;
            if (installmentAmount <= capitalPerInstallment) {
                capitalToInstallment = installmentAmount;
                interesToInstallment = 0
            } else {
                capitalToInstallment = capitalPerInstallment;
                interesToInstallment = installmentAmount - capitalPerInstallment;
            }
            let capitalPayed: number;
            let interesToPay: number;
            if (restado <= capitalToInstallment) {
                capitalPayed = restado;
                interesToPay = 0
            } else {
                capitalPayed = capitalToInstallment;
                interesToPay = restado - capitalToInstallment;
            }

            installments.push({
                ...defaultInstallment(),
                installmentTotalNumber: debt.installmentCount,
                amount: installmentAmount,
                amountPaid: restado,
                capital: capitalToInstallment,
                capitalPaid: capitalPayed,
                interestPaid: interesToPay,
                interest: interesToInstallment,
                paidAt: restado >= installmentAmount ? new Date().toISOString().slice(0, 10) : "",
                clientNumber: costumer?.applicant.phone || "",
                percentageOfCapitalPaid: paidPorcential(restado, installmentAmount),
                routeId: debt.routeId,
                companyId: companyId,
                debtId: debt.id,
                clientId: costumer?.id || "",
                clientDocument: debt.clientDocument,
                clientName: debt.clientName,
                clientAddres: {
                    address: costumer?.applicant.address?.address || "",
                    neighborhood: costumer?.applicant.address?.neighborhood || "",
                    stratum: costumer?.applicant.address?.stratum || 0,
                    city: costumer?.applicant.address?.city || "",
                    locationGPS: {
                        latitude: costumer?.applicant.address?.locationGPS?.latitude || 0,
                        longitude: costumer?.applicant.address?.locationGPS?.longitude || 0,
                        accuracy: costumer?.applicant.address?.locationGPS?.accuracy || 0,
                        coordinates: costumer?.applicant.address?.locationGPS?.coordinates,
                        provider: costumer?.applicant.address?.locationGPS?.provider,
                    }
                },
                installmentNumber: i + 1,
                interestRate: debt.interestRate,
                dueDate: dueDate.toISOString().slice(0, 10),
                status: status,
                createdAt: new Date().toISOString().slice(0, 10),
            });

            if (restado > 0) {

                payments.push({
                    ...emptyPayment(),
                    capitalPaid: capitalPayed,
                    interestPaid: interesToPay,
                    clientId: costumer?.id || "",
                    debtId: debt.id,
                    idRoute: debt.routeId,
                    isTight: true,
                    collectorObservation: "Pago migrado de Excel",
                    accountantObservation: "Confirmado desde migración masiva",
                    installmentId: i.toString(),
                    clientName: debt.clientName,
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
                    !installment.amountPaid ||
                    installment.amountPaid <= 0
                ) {
                    skipped++;
                    return;
                }


                const payment: Payment = {
                    amount: installment.amountPaid,
                    capitalPaid: installment.capitalPaid,
                    interestPaid: installment.interestPaid,
                    arrearsPaid: 0,
                    clientId: installment.clientId,
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

                    clientName:
                        installment.clientName,

                    collectorName: "Sistema",

                    collectorId:
                        input.collectorId,

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





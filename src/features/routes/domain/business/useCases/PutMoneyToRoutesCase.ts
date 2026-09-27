import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type { RouteGateway } from "../../infraestructure/RouteGateway"


export interface PutMoneyToRoutes {
    companyId: string;
    routeId: string;
    CollectorId?: string;
    BankAccountId?: string;

    /**monto en  que ingreso el cobrador*/
    capitalPaid: number;
    /**monto en  por interes*/
    interestPaid: number;
    /**monto en  por mora*/
    arrearsPaid: number
    /**monto en  por mora por aplazamiento formal */
    defermentPaid: number;
    /**total en  */
    totalPaid: number
}

export interface PutMoneyToRoutesInput {
    putMoneyToRoutes: PutMoneyToRoutes[]
}

export interface PutMoneyToRoutesOutput {
    state: boolean
}

export interface PutMoneyToRoutesError {
    code: "UNKNOWN_ERROR" | "VALIDATION_ERROR"
    message?: string
}

export class PutMoneyToRoutesCase {
    private readonly routeRepository: RouteGateway
    constructor(
        routeRepository: RouteGateway

    ) {
        this.routeRepository = routeRepository;
    }

    /**
     * Ejecuta la lógica de putting money para rutas
     * 
     * @param input Objeto con los datos necesarios para la operación
     * @returns Result con el estado de la operación o un error
     */
    public async execute(input: PutMoneyToRoutesInput): Promise<Result<PutMoneyToRoutesOutput, PutMoneyToRoutesError>> {
        try {
            const allPutsMoneyToRoute: PutMoneyToRoutes[] = [];
            for (const putMoneyToRoute of input.putMoneyToRoutes) {
                // Validaciones básicas
                if (!putMoneyToRoute.companyId) {
                    break;
                }
                if (!putMoneyToRoute.routeId) {
                    break;
                }
                if (putMoneyToRoute.capitalPaid < 0 || putMoneyToRoute.interestPaid < 0 || putMoneyToRoute.arrearsPaid < 0 || putMoneyToRoute.defermentPaid < 0 || putMoneyToRoute.totalPaid < 0) {
                    break;
                }

                // Validar que haya saldos válidos
                const validCashEntries = putMoneyToRoute.capitalPaid + putMoneyToRoute.interestPaid + putMoneyToRoute.arrearsPaid + putMoneyToRoute.defermentPaid;

                if (validCashEntries !== putMoneyToRoute.totalPaid) {
                    break;
                }

                if (putMoneyToRoute.CollectorId === undefined && putMoneyToRoute.BankAccountId === undefined) {
                    break;
                }

            }
            console.log("input", allPutsMoneyToRoute);
            // Llamar al repositorio
            var result = await this.routeRepository.PutMoneyToRoutes(input);

            if (result.ok!) {
                return fail({
                    code: "UNKNOWN_ERROR",
                    message: "Error desconocido al putting money en rutas"
                });
            }

            return ok({ state: true });

        } catch (error: any) {
            console.error('[PutMoneyToRoutesCase] Error:', error);
            return fail({
                code: "UNKNOWN_ERROR",
                message: error?.message || "Error desconocido al putting money en rutas"
            });
        }
    }
}
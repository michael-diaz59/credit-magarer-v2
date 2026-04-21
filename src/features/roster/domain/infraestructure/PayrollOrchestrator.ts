import { FirebasePayrollRepository } from "../../repository/FirebasePayrollRepository";
import { RegisterPayrollUseCase, type RegisterPayrollInput, type RegisterPayrollOutput, type RegisterPayrollError } from "../business/useCases/RegisterPayrollUseCase";
import { GetPayrollPaymentsByUserUseCase, type GetPayrollPaymentsByUserInput, type GetPayrollPaymentsByUserError } from "../business/useCases/GetPayrollPaymentsByUserUseCase";
import { GetPayrollPaymentByIdUseCase, type GetPayrollPaymentByIdInput, type GetPayrollPaymentByIdError } from "../business/useCases/GetPayrollPaymentByIdUseCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type { PayrollGateway } from "./PayrollGateway";
import type { Payroll } from "../business/entities/Payroll";

export default class PayrollOrchestrator {
    private registerPayrollUseCase: RegisterPayrollUseCase;
    private getPayrollPaymentsByUserUseCase: GetPayrollPaymentsByUserUseCase;
    private getPayrollPaymentByIdUseCase: GetPayrollPaymentByIdUseCase;
    private payrollGateway: PayrollGateway;

    constructor() {
        this.payrollGateway = new FirebasePayrollRepository();
        this.registerPayrollUseCase = new RegisterPayrollUseCase(this.payrollGateway);
        this.getPayrollPaymentsByUserUseCase = new GetPayrollPaymentsByUserUseCase(this.payrollGateway);
        this.getPayrollPaymentByIdUseCase = new GetPayrollPaymentByIdUseCase(this.payrollGateway);
    }

    async registerPayment(input: RegisterPayrollInput): Promise<Result<RegisterPayrollOutput, RegisterPayrollError>> {
        return this.registerPayrollUseCase.execute(input);
    }

    async getPaymentsByUserId(input: GetPayrollPaymentsByUserInput): Promise<Result<Payroll[], GetPayrollPaymentsByUserError>> {
        return this.getPayrollPaymentsByUserUseCase.execute(input);
    }

    async getPaymentById(input: GetPayrollPaymentByIdInput): Promise<Result<Payroll, GetPayrollPaymentByIdError>> {
        return this.getPayrollPaymentByIdUseCase.execute(input);
    }
}

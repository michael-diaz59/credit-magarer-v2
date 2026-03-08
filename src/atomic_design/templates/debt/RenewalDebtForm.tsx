import { useWatch } from "react-hook-form";

import { Controller, useForm } from "react-hook-form";
import { forwardRef, useImperativeHandle } from "react";
import { MoneyField } from "../../atoms/MoneyField";
import {
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem,
    Stack,
    TextField,
    Grid,
} from "@mui/material";
import { diasDelMesPorTermino } from "../../../core/helpers/debts/diasPorTermino";

export type Collector = {
    id: string;
    name: string;
};

function mergeDefined<T>(base: T, override?: Partial<T>): T {
    if (!override) return base;

    const result = { ...base };

    for (const key in override) {
        if (override[key] !== undefined) {
            result[key] = override[key] as T[typeof key];
        }
    }

    return result;
}

export type DebtFormValues = {
    months?: number;
    collectorId: string;
    calculationMode: "installments" | "months";
    costumerDocument: string;
    type: "credito" | "prenda";
    totalAmount: number;
    debtTerms: "diario" | "semanal" | "quincenal" | "mensual";
    interestRate: number;
    installmentCount: number;
    startDate: string;
    diasMes: number;
};

const baseDefaults: DebtFormValues = {
    collectorId: "",
    calculationMode: "installments",
    costumerDocument: "",
    months: undefined,
    type: "credito",
    totalAmount: 0,
    debtTerms: "diario",
    interestRate: 0,
    installmentCount: 1,
    startDate: new Date().toISOString().slice(0, 10),
    diasMes: 24,
};

export type DebtFormRef = {
    validate: () => Promise<boolean>;
    getValues: () => DebtFormValues;
};

type Props = {
    collectors: Collector[];
    defaultValues?: Partial<DebtFormValues>;
};

export const RenewalDebtForm = forwardRef<DebtFormRef, Props>(
    ({ collectors, defaultValues }, ref) => {
        const {
            register,
            control,
            trigger,
            getValues,
            setValue,
            formState: { errors },
        } = useForm<DebtFormValues>({
            defaultValues: mergeDefined(baseDefaults, defaultValues),
        });

        const selectedDebtTerm = useWatch({
            control,
            name: "debtTerms",
        });

        const calculationMode = useWatch({
            control,
            name: "calculationMode",
        });

        // 🔥 Exponemos funciones al padre
        useImperativeHandle(ref, () => ({
            validate: async () => {
                return await trigger(); // valida todo el form
            },
            getValues: () => getValues(),
        }));

        return (
            <Grid container spacing={2}>
                {/* SECCION 1 */}
                <Grid>
                    <Stack spacing={2}>
                        {/* COBRADOR */}
                        <Controller
                            name="collectorId"
                            control={control}
                            rules={{ required: "Debe seleccionar un cobrador" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value ?? ""}
                                    select
                                    label="Cobrador"
                                    fullWidth
                                    error={!!errors.collectorId}
                                    helperText={errors.collectorId?.message}
                                >
                                    {collectors.map((collector) => (
                                        <MenuItem key={collector.id} value={collector.id}>
                                            {collector.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* CÉDULA */}
                        <TextField
                            label="Cédula del cliente"
                            fullWidth
                            disabled
                            error={!!errors.costumerDocument}
                            helperText={errors.costumerDocument?.message}
                            {...register("costumerDocument", {
                                required: "La cédula es obligatoria",
                            })}
                        />

                        {/* TIPO */}
                        <Controller
                            name="type"
                            control={control}
                            rules={{ required: "Seleccione el tipo de crédito" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Tipo de crédito"
                                    fullWidth
                                    error={!!errors.type}
                                    helperText={errors.type?.message}
                                >
                                    <MenuItem value="credito">Crédito</MenuItem>
                                    <MenuItem value="prenda">Prenda</MenuItem>
                                </TextField>
                            )}
                        />
                    </Stack>
                </Grid>

                <Grid>
                    <Stack spacing={2}>
                        {/* MONTO */}
                        <MoneyField<DebtFormValues>
                            name="totalAmount"
                            control={control}
                            label="Monto renovación (Capital)"
                            rules={{
                                required: "El monto es obligatorio",
                                min: { value: 1, message: "Debe ser mayor a 0" },
                            }}
                        />

                        {/* PERIODICIDAD */}
                        <Controller
                            name="debtTerms"
                            control={control}
                            rules={{ required: "Seleccione periodicidad" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Periodicidad"
                                    fullWidth
                                    error={!!errors.debtTerms}
                                    helperText={errors.debtTerms?.message}
                                    onChange={(e) => {
                                        const value = e.target.value as DebtFormValues["debtTerms"];
                                        field.onChange(value);

                                        setValue("diasMes", diasDelMesPorTermino[value]);
                                    }}
                                >
                                    <MenuItem value="diario">Diario</MenuItem>
                                    <MenuItem value="semanal">Semanal</MenuItem>
                                    <MenuItem value="quincenal">Quincenal</MenuItem>
                                    <MenuItem value="mensual">Mensual</MenuItem>
                                </TextField>
                            )}
                        />

                        {/* dias para 1 mes */}
                        {selectedDebtTerm === "diario" && (
                            <Controller
                                name="diasMes"
                                control={control}
                                rules={{ required: "Seleccione la cantidad de días" }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        select
                                        label="Cantidad de días del mes"
                                        fullWidth
                                        error={!!errors.diasMes}
                                        helperText={errors.diasMes?.message}
                                    >
                                        <MenuItem value={24}>24 dias</MenuItem>
                                        <MenuItem value={30}>30 dias</MenuItem>
                                    </TextField>
                                )}
                            />
                        )}
                    </Stack>
                </Grid>

                <Grid>
                    <Stack spacing={2}>
                        {/* INTERÉS */}
                        <TextField
                            label="Tasa de interés (%)"
                            type="number"
                            fullWidth
                            error={!!errors.interestRate}
                            helperText={errors.interestRate?.message}
                            {...register("interestRate", {
                                valueAsNumber: true,
                                required: "La tasa es obligatoria",
                                min: { value: 0, message: "No puede ser negativa" },
                            })}
                        />

                        {/* selector de meses o cuotas */}
                        <Controller
                            name="calculationMode"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup row {...field}>
                                    <FormControlLabel
                                        value="installments"
                                        control={<Radio />}
                                        label="Por número de cuotas"
                                    />
                                    <FormControlLabel
                                        value="months"
                                        control={<Radio />}
                                        label="Por número de meses"
                                    />
                                </RadioGroup>
                            )}
                        />

                        {/* CUOTAS */}
                        <TextField
                            label="Número de cuotas"
                            type="number"
                            fullWidth
                            disabled={calculationMode === "months"}
                            error={!!errors.installmentCount}
                            helperText={errors.installmentCount?.message}
                            {...register("installmentCount", {
                                valueAsNumber: true,
                                required:
                                    calculationMode === "installments"
                                        ? "El número de cuotas es obligatorio"
                                        : false,
                                min: { value: 1, message: "Debe ser mínimo 1" },
                            })}
                        />

                        {/* MESES */}
                        {calculationMode === "months" && (
                            <TextField
                                label="Duración en meses"
                                type="number"
                                fullWidth
                                error={!!errors.months}
                                helperText={errors.months?.message}
                                {...register("months", {
                                    valueAsNumber: true,
                                    required: "Debe indicar los meses",
                                    min: { value: 1, message: "Debe ser mínimo 1 mes" },
                                })}
                            />
                        )}

                        {/* FECHA */}
                        <TextField
                            label="Fecha de inicio"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.startDate}
                            helperText={errors.startDate?.message}
                            {...register("startDate", {
                                required: "La fecha es obligatoria",
                            })}
                        />
                    </Stack>
                </Grid>
            </Grid>
        );
    },
);

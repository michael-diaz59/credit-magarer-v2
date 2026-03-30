import { useWatch } from "react-hook-form";

import { Controller, useForm } from "react-hook-form";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import { MoneyField } from "../../atoms/MoneyField";
import {
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Stack,
  TextField,
  Grid,
  Typography,
} from "@mui/material";
import { diasDelMesPorTermino } from "../../../core/helpers/debts/diasPorTermino";
import type { Route } from "../../../features/routes/domain/business/entities/Route";
import type { Debt, DebtTerms, DebtType } from "../../../features/debits/domain/business/entities/Debt";
import type { CalculationMode } from "./form/constsForm";
import { mergeDefined } from "../../sub_atomic_particles/helpers";
import { MoneyTypography } from "../../atoms/MoneyTypography";



/**
 * son las propiedades necesarias para el formulario
 */
export type DebtFormValues = {
  months?: number;
  routeId: string;
  collectorId: string;
  calculationMode: CalculationMode;
  costumerDocument: string;
  type: DebtType;
  totalAmount: number;
  debtTerms: DebtTerms;
  interestRate: number;
  installmentCount: number;
  startDate: string;
  diasMes: number;
};

/**
 * son los valores por defecto del formulario
 */
const debtFormDefaults = {
  debtTerms: "diario" as DebtTerms,
  calculationMode: "installments" as CalculationMode,
};

/**
 * son los valores por defecto del formulario
 */
const baseDefaults: DebtFormValues = {
  collectorId: "",
  routeId: "",
  calculationMode: debtFormDefaults.calculationMode,
  costumerDocument: "",
  months: undefined,
  type: "credito",
  totalAmount: 0,
  debtTerms: debtFormDefaults.debtTerms,
  interestRate: 0,
  installmentCount: 1,
  startDate: "",
  diasMes: diasDelMesPorTermino[debtFormDefaults.debtTerms],
};

/**
 * Funciones expuestas al componente padre mediante forwardRef.
 * Permiten controlar el formulario desde afuera sin hacer submit directo.
 *
 * validate():
 *  - Ejecuta la validación de TODO el formulario.
 *  - Retorna true si todo es válido, false si hay errores.
 *
 * validateFields(fields):
 *  - Ejecuta la validación solo de los campos especificados.
 *  - Útil para formularios por pasos o validaciones parciales.
 *
 * getValues():
 *  - Retorna todos los valores actuales del formulario
 *    sin necesidad de hacer submit.
 *
 * Uso típico desde el padre:
 *
 * const isValid = await formRef.current?.validate();
 * if (!isValid) return;
 *
 * const values = formRef.current?.getValues();
 * guardar(values);
 *
 */
export type DebtFormRef = {
  validate: () => Promise<boolean>;
  validateFields: (fields: (keyof DebtFormValues)[]) => Promise<boolean>;
  getValues: () => DebtFormValues;
};

/**
 * son las propiedades necesarias visualizacion, edicion y validaciones
 */
export type DebtFormConfig = {
  visibleFields?: (keyof DebtFormValues)[];
  editableFields?: (keyof DebtFormValues)[];
  requiredFields?: (keyof DebtFormValues)[];
};

/**
 * son las propiedades necesarias para el formulario
 */
type Props = {
  routes: Route[];
  debValues?: DebtFormValues;
  config?: DebtFormConfig;
  renewalProposal?: DebtFormValues;
};

export const DebtForm = forwardRef<DebtFormRef, Props>(
  ({ routes, debValues: defaultValues, config, renewalProposal }, ref) => {

    const isVisible = (field: keyof DebtFormValues) => {
      return config?.visibleFields?.includes(field) ?? true;
    };

    const isEditable = (field: keyof DebtFormValues) => {
      return config?.editableFields?.includes(field) ?? true;
    };

    const isRequired = (field: keyof DebtFormValues) => {
      return config?.requiredFields?.includes(field) ?? false;
    };

    const formDefaults = useMemo(
      () => mergeDefined(baseDefaults, defaultValues),
      [defaultValues]
    );

    const {
      register,
      control,
      trigger,
      getValues,
      setValue,
      formState: { errors },
    } = useForm<DebtFormValues>({
      defaultValues: formDefaults,
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
        return await trigger();
      },
      validateFields: async (fields) => {
        return await trigger(fields);
      },
      getValues: () => getValues(),
    }));

    return (
      <Grid container spacing={2}>
        {/* SECCION 1 */}
        <Grid>
          <Stack spacing={2}>
            {/* COBRADOR */}
            {isVisible("routeId") && (
              <>
                <Controller
                  name="routeId"
                  control={control}
                  rules={{
                    required: isRequired("routeId")
                      ? "Debe seleccionar una ruta"
                      : false,
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Ruta"
                      fullWidth
                      value={field.value || ""}
                      disabled={!isEditable("routeId")}
                      error={!!errors.routeId}
                      helperText={errors.routeId?.message}
                    >
                      <MenuItem value="">
                        <em>Seleccione una ruta</em>
                      </MenuItem>

                      {routes.map((route) => (
                        <MenuItem key={route.id} value={route.id}>
                          {route.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                {renewalProposal && (
                  <Typography>
                    Ruta original: {renewalProposal.routeId}
                  </Typography>
                )}
              </>
            )}
            {/* CÉDULA */}
            {isVisible("costumerDocument") &&

              (<Controller
                name="costumerDocument"
                control={control}
                rules={{
                  required: isRequired("costumerDocument")
                    ? "La cédula es obligatoria"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cédula del cliente"
                    fullWidth
                    disabled={!isEditable("costumerDocument")}
                    error={!!errors.costumerDocument}
                    helperText={errors.costumerDocument?.message}
                  />
                )}
              />
              )}

            {/* TIPO */}
            {isVisible("type") && (
              <>
                <Controller
                  name="type"
                  control={control}
                  rules={{
                    required: isRequired("type")
                      ? "El tipo de crédito es obligatorio"
                      : false
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Tipo de crédito"
                      fullWidth
                      disabled={!isEditable("type")}
                      error={!!errors.type}
                      helperText={errors.type?.message}
                      value={field.value || ""}
                    >
                      <MenuItem value="credito">Crédito</MenuItem>
                      <MenuItem value="prenda">Prenda</MenuItem>
                    </TextField>
                  )}
                />
                {renewalProposal && (
                  <Typography>
                    Tipo de crédito original: {renewalProposal.type}
                  </Typography>
                )}
              </>
            )}
          </Stack>
        </Grid>

        <Grid>
          <Stack spacing={2}>
            {/* MONTO */}
            {isVisible("totalAmount") &&

              <>
                <Controller
                  name="totalAmount"
                  control={control}
                  rules={{
                    required: isRequired("totalAmount")
                      ? "El monto es obligatorio"
                      : false,
                    min: { value: 1, message: "Debe ser mayor a 0" }
                  }}
                  render={({ field }) => (

                    <MoneyField<DebtFormValues>
                      {...field}
                      name="totalAmount"
                      control={control}
                      label="Monto capital"
                      disabled={!isEditable("totalAmount")}
                      error={!!errors.totalAmount}
                      helperText={errors.totalAmount?.message}

                    />
                  )}
                />
                {renewalProposal && (
                  <MoneyTypography
                    label="Monto capital original"
                    value={renewalProposal.totalAmount}
                  />
                )}
              </>

            }

            {/* PERIODICIDAD */}
            {isVisible("debtTerms") && <>
              <Controller
                name="debtTerms"
                control={control}
                rules={{
                  required: isRequired("debtTerms")
                    ? "La periodicidad es obligatoria"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    disabled={!isEditable("debtTerms")}
                    value={field.value || ""}
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
              {renewalProposal && (
                <MoneyTypography
                  label="Monto capital original"
                  value={renewalProposal.totalAmount}
                />
              )}
            </>
            }

            {/* dias para 1 mes */}
            {selectedDebtTerm === "diario" && (
              <><Controller
                name="diasMes"
                control={control}
                rules={{
                  required: isRequired("diasMes")
                    ? "La cantidad de días es obligatoria"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    select
                    label="Cantidad de días del mes"
                    fullWidth
                    disabled={!isEditable("diasMes")}
                    value={field.value || ""}
                    error={!!errors.diasMes}
                    helperText={errors.diasMes?.message}
                  >
                    <MenuItem value={24}>24 días</MenuItem>
                    <MenuItem value={30}>30 días</MenuItem>
                  </TextField>
                )}
              />
                {renewalProposal && (
                  <MoneyTypography
                    label="Cantidad de días del mes original"
                    value={renewalProposal.diasMes}
                  />
                )}
              </>
            )}
          </Stack>
        </Grid>

        <Grid>
          <Stack spacing={2}>
            {/* INTERÉS */}
            {isVisible("interestRate") && <>
              <Controller
                name="interestRate"
                control={control}
                rules={{
                  required: isRequired("interestRate")
                    ? "La tasa es obligatoria"
                    : false,
                  min: { value: 0, message: "No puede ser negativa" },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tasa de interés (%)"
                    type="number"
                    fullWidth
                    disabled={!isEditable("interestRate")}
                    error={!!errors.interestRate}
                    helperText={errors.interestRate?.message}
                  />

                )}
              />
              {renewalProposal && (
                <MoneyTypography
                  label="Tasa de interes original"
                  value={renewalProposal.interestRate}
                />
              )}
            </>
            }

            {/* selector de meses o cuotas */}
            {isVisible("calculationMode") && <Controller
              name="calculationMode"
              control={control}
              rules={{
                required: isRequired("calculationMode")
                  ? "El modo de cálculo es obligatorio"
                  : false,
              }}
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
            }

            {/* CUOTAS */}
            {isVisible("installmentCount") && calculationMode === "installments" &&
              <><Controller
                name="installmentCount"
                control={control}
                rules={{
                  required: isRequired("installmentCount")
                    ? "El número de cuotas es obligatorio"
                    : false,
                  min: { value: 1, message: "Debe ser mínimo 1" },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de cuotas"
                    type="number"
                    fullWidth
                    disabled={!isEditable("installmentCount")}
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
                  />)}
              />
                {renewalProposal && (
                  <MoneyTypography
                    label="Cantidad de cuotas original"
                    value={renewalProposal.installmentCount}
                  />
                )}
              </>


            }

            {/* MESES */}
            {calculationMode === "months" && (
              <Controller
                name="months"
                control={control}
                rules={{
                  required: isRequired("months")
                    ? "La duración en meses es obligatoria"
                    : false,
                  min: { value: 1, message: "Debe ser mínimo 1 mes" },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Duración en meses"
                    type="number"
                    disabled={!isEditable("months")}
                    fullWidth
                    error={!!errors.months}
                    helperText={errors.months?.message}
                  />)}
              />
            )}

            {/* FECHA */}
            {isVisible("startDate") && <>
              <Controller
                name="startDate"
                control={control}
                rules={{
                  required: isRequired("startDate")
                    ? "La fecha es obligatoria"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fecha de inicio"
                    type="date"
                    fullWidth
                    disabled={!isEditable("startDate")}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                    {...register("startDate", {
                      required: "La fecha es obligatoria",
                    })}
                  />)} />
              {renewalProposal && (
                <Typography>
                  Fecha de inicio original: {renewalProposal.startDate}
                </Typography>
              )}
            </>
            }
          </Stack>
        </Grid>
      </Grid>
    );
  },
);

export function mapDebtToForm(debt: Debt): DebtFormValues {
  return {
    calculationMode: "installments",
    routeId: debt.routeId,
    collectorId: debt.collectorId,
    costumerDocument: debt.costumerDocument,
    type: debt.type,
    totalAmount: debt.totalAmount,
    debtTerms: debt.debtTerms,
    interestRate: debt.interestRate,
    installmentCount: debt.installmentCount,
    startDate: debt.startDate,
    diasMes: debt.diasMes,
  };
}


/**
 * Mezcla un Debt original con los valores
 * actuales del formulario de edición.
 *
 * Se usa en pantallas de edición donde el formulario solo maneja
 * algunos campos del Debt, pero la entidad completa contiene
 * muchos más datos (id, estado, pagos, fechas, etc.).
 *
 * La función mantiene toda la información original del Debt
 * y sobrescribe únicamente los campos editables provenientes
 * del formulario.
 *
 * Flujo típico:
 * 1. Traer Debt del servidor
 * 2. Mapear Debt -> Form
 * 3. Usuario edita formulario
 * 4. Form -> merge con Debt original
 * 5. Guardar Debt actualizado
 */
export function mergeDebtWithForm(
  originalDebt: Debt,
  formValues: DebtFormValues
): Debt {
  return {
    ...originalDebt,

    // Campos que vienen del formulario
    routeId: formValues.routeId,
    collectorId: formValues.collectorId,
    costumerDocument: formValues.costumerDocument,
    type: formValues.type,
    totalAmount: formValues.totalAmount,
    debtTerms: formValues.debtTerms,
    interestRate: formValues.interestRate,
    installmentCount: formValues.installmentCount,
    startDate: formValues.startDate,
    diasMes: formValues.diasMes,

    // Campos derivados
    capital: formValues.totalAmount,
  };
}


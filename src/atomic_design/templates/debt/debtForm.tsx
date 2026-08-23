import { useWatch } from "react-hook-form";

import { Controller, useForm } from "react-hook-form";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
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
  Checkbox,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { diasDelMesPorTermino } from "../../../core/helpers/debts/diasPorTermino";
import type { Route } from "../../../features/routes/domain/business/entities/Route";
import type { Prepayment, Debt, DebtStatus, DebtTerms, DebtType } from "../../../features/debits/domain/business/entities/Debt";
import type { CalculationMode } from "./form/constsForm";
import { mergeDefined } from "../../sub_atomic_particles/helpers";
import { MoneyTypography } from "../../atoms/MoneyTypography";
import { formatISOToInputDate } from "../../../core/helpers/dates/dateConvert";



/**
 * son las propiedades necesarias para el formulario
 */
export type DebtFormValues = {
  months?: number;
  routeId: string;
  calculationMode: CalculationMode;
  clientDocument: string;
  status: DebtStatus;
  type: DebtType;
  prepayment: Prepayment;
  pledge: boolean;
  capital: number;
  debtTerms: DebtTerms;
  pledgeDescription?: string
  pledgeValue?: number
  interestRate: number;
  installmentCount: number;
  startDate: string;
  daysPerMonth: number;
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
  routeId: "",
  status: "tentativa",
  pledge: false,
  prepayment: "no",
  pledgeDescription: "",
  pledgeValue: 0,
  calculationMode: debtFormDefaults.calculationMode,
  clientDocument: "",
  months: undefined,
  type: "fijo",
  capital: 0,
  debtTerms: debtFormDefaults.debtTerms,
  interestRate: 0,
  installmentCount: 1,
  startDate: "",
  daysPerMonth: diasDelMesPorTermino[debtFormDefaults.debtTerms],
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
      resetField,
      setValue,
      reset,
      formState: { errors },
    } = useForm<DebtFormValues>({
      defaultValues: formDefaults,
      shouldUnregister: true,
    });

    useEffect(() => {
      reset(formDefaults);
    }, [formDefaults, reset]);



    const selectedDebtTerm = useWatch({
      control,
      name: "debtTerms",
    });

    const calculationMode = useWatch({
      control,
      name: "calculationMode",
    });

    const type = useWatch({
      control,
      name: "type",
    });

    const hasDiscount = useWatch({
      control,
      name: "pledge",
    });
    useEffect(() => {
      if (!hasDiscount) {
        resetField("pledgeDescription");
        resetField("pledgeValue")
      }
    }, [hasDiscount, resetField]);

    // 🔥 Exponemos funciones al padre
    useImperativeHandle(ref, () => ({
      validate: async () => {
        return await trigger();
      },
      validateFields: async (fields) => {
        return await trigger(fields);
      },
      getValues: () => normalizeDebtForm(getValues()),
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
            <Controller name="pledge" control={control} rules={{
              required: "Debes marcar esta opción"
            }}
              render={({ field }) => (<FormControl error={!!errors.pledge}>
                <FormControlLabel control={
                  <Checkbox checked={field.value ?? false} disabled={!isEditable("pledge")} onChange={(e) => field.onChange(e.target.checked)} />
                } label="¿Se entrega prenda?" />
                <FormHelperText>
                  {errors.pledge?.message}
                </FormHelperText>
              </FormControl>
              )} />
            {/* Mostrar siguiente campo si prenda es true */}
            {hasDiscount && (
              <Controller
                name="pledgeDescription"
                control={control}
                rules={{
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción de la prenda"
                    fullWidth
                    multiline
                    rows={3}
                    disabled={!isEditable("pledgeDescription")}
                    error={!!errors.pledgeDescription}
                    helperText={errors.pledgeDescription?.message}
                  />
                )}
              />

            )}
            {hasDiscount && (
              <Controller name="pledgeValue" control={control} rules={{
              }} render={({ field }) => (
                <TextField
                  {...field}
                  label="Valor de la prenda"
                  fullWidth
                  disabled={!isEditable("pledgeValue")}
                  error={!!errors.pledgeValue}
                  helperText={errors.pledgeValue?.message}
                />
              )} />

            )}

            {/* CÉDULA */}
            {isVisible("clientDocument") &&

              (<Controller
                name="clientDocument"
                control={control}
                rules={{
                  required: isRequired("clientDocument")
                    ? "La cédula es obligatoria"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cédula del cliente"
                    fullWidth
                    disabled={!isEditable("clientDocument")}
                    error={!!errors.clientDocument}
                    helperText={errors.clientDocument?.message}
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
                      <MenuItem value="fijo">fijo</MenuItem>
                      <MenuItem value="variable">variable</MenuItem>
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
            {(type == "variable") && (
              <Controller
                name="prepayment"
                control={control}
                rules={{
                  required: isRequired("prepayment")
                    ? "El adelanto es obligatorio"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Adelanto en el credito"
                    fullWidth
                    disabled={!isEditable("prepayment")}
                    error={!!errors.prepayment}
                    helperText={errors.prepayment?.message}
                    value={field.value || ""}
                  >
                    <MenuItem value="si">si</MenuItem>
                    <MenuItem value="no">no</MenuItem>
                  </TextField>
                )}
              />
            )}
          </Stack>
        </Grid>

        <Grid>
          <Stack spacing={2}>
            {/* MONTO */}
            {isVisible("capital") &&

              <>
                <MoneyField<DebtFormValues>
                  name="capital"
                  control={control}
                  label="Monto capital"
                  disabled={!isEditable("capital")}
                  error={!!errors.capital}
                  helperText={errors.capital?.message}

                />
                {renewalProposal && (
                  <MoneyTypography
                    label="Monto capital original"
                    value={renewalProposal.capital}
                  />
                )}
              </>

            }

            {/* ESTADO */}
            {isVisible("status") && (
              <Controller
                name="status"
                control={control}
                rules={{
                  required: isRequired("status")
                    ? "El estado es obligatorio"
                    : false,
                }}
                render={({ field }) => (
                  <Stack direction="row" spacing={2}>
                    <Typography>Estado de la deuda: </Typography>
                    <Typography>{field.value}</Typography>
                  </Stack>


                )}
              />
            )}

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

                      setValue("daysPerMonth", diasDelMesPorTermino[value]);
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
                <Typography>
                  Periodicidad original: {renewalProposal.debtTerms}
                </Typography>
              )}
            </>
            }

            {/* dias para 1 mes */}
            {selectedDebtTerm === "diario" && (
              <><Controller
                name="daysPerMonth"
                control={control}
                rules={{
                  required: isRequired("daysPerMonth")
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
                    disabled={!isEditable("daysPerMonth")}
                    value={field.value || ""}
                    error={!!errors.daysPerMonth}
                    helperText={errors.daysPerMonth?.message}
                  >
                    <MenuItem value={24}>24 días</MenuItem>
                    <MenuItem value={30}>30 días</MenuItem>
                  </TextField>
                )}
              />
                {renewalProposal && (
                  <Typography>
                    Cantidad de días del mes original: {renewalProposal.daysPerMonth}
                  </Typography>
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
                <Typography>
                  Tasa de interes original: {renewalProposal.interestRate}
                </Typography>
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
                <FormControl disabled={!isEditable("calculationMode")}>
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
                </FormControl>
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
                  <Typography>
                    Cantidad de cuotas original: {renewalProposal.installmentCount}
                  </Typography>
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
                    value={field.value ? formatISOToInputDate(field.value) : ""}
                    label="Fecha de inicio"
                    type="date"
                    fullWidth
                    disabled={!isEditable("startDate")}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                  />)} />
              {renewalProposal && (
                <Typography>
                  Fecha de inicio original: {formatISOToInputDate(renewalProposal.startDate)}
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

function normalizeDebtForm(values: DebtFormValues): DebtFormValues {
  if (values.calculationMode === "installments") {
    return {
      ...values,
      months: 0,
    };
  } else {
    return {
      ...values,
      installmentCount: 0,
    };
  }
}

export function mapDebtToForm(debt: Debt): DebtFormValues {
  return {
    prepayment: debt.prepayment || "no",
    calculationMode: "installments",
    routeId: debt.routeId,
    status: debt.status,
    clientDocument: debt.clientDocument,
    type: debt.type,
    capital: debt.capital,
    debtTerms: debt.debtTerms,
    interestRate: debt.interestRate,
    installmentCount: debt.installmentCount,
    startDate: debt.startDate,
    daysPerMonth: debt.daysPerMonth,
    pledge: debt.pledge,
    pledgeDescription: debt.pledgeDescription,
    pledgeValue: debt.pledgeValue,
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
  console.log("originalDebt", originalDebt)
  console.log("formValues", formValues)
  return {
    ...originalDebt,

    // Campos que vienen del formulario
    routeId: formValues.routeId,
    status: formValues.status,
    clientDocument: formValues.clientDocument,
    type: formValues.type,
    capital: formValues.capital,
    debtTerms: formValues.debtTerms,
    interestRate: formValues.interestRate,
    installmentCount: formValues.installmentCount,
    startDate: formValues.startDate,
    daysPerMonth: formValues.daysPerMonth,

    // la suma del capital mas intereses se hace en el caso de uso
    amount: 0,
  };
}


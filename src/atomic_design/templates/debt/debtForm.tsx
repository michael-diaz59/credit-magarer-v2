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
import type { adelanto, Debt, DebtStatus, DebtTerms, DebtType } from "../../../features/debits/domain/business/entities/Debt";
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
  costumerDocument: string;
  status: DebtStatus;
  type: DebtType;
  adelanto: adelanto;
  prenda: boolean;
  capital: number;
  debtTerms: DebtTerms;
  prendaDescription: string
  prendaValue: number
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
  routeId: "",
  status: "tentativa",
  prenda: false,
  adelanto: "no",
  prendaDescription: "",
  prendaValue: 0,
  calculationMode: debtFormDefaults.calculationMode,
  costumerDocument: "",
  months: undefined,
  type: "fijo",
  capital: 0,
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
      resetField,
      setValue,
      formState: { errors },
    } = useForm<DebtFormValues>({
      defaultValues: formDefaults,
      shouldUnregister: true,
    });



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
      name: "prenda",
    });
    useEffect(() => {
      if (!hasDiscount) {
        resetField("prendaDescription");
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
            <Controller name="prenda" control={control} rules={{
              required: "Debes marcar esta opción"
            }}
              render={({ field }) => (<FormControl error={!!errors.prenda}>
                <FormControlLabel control={
                  <Checkbox checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />
                } label="Activo" />
                <FormHelperText>
                  {errors.prenda?.message}
                </FormHelperText>
              </FormControl>
              )} />
            {/* Mostrar siguiente campo si prenda es true */}
            {hasDiscount && (
              <Controller
                name="prendaDescription"
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
                    disabled={!isEditable("prendaDescription")}
                    error={!!errors.prendaDescription}
                    helperText={errors.prendaDescription?.message}
                  />
                )}
              />

            )}
            {hasDiscount && (
              <Controller name="prendaValue" control={control} rules={{
              }} render={({ field }) => (
                <TextField
                  {...field}
                  label="Valor de la prenda"
                  fullWidth
                  disabled={!isEditable("prendaValue")}
                  error={!!errors.prendaValue}
                  helperText={errors.prendaValue?.message}
                />
              )} />

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
                name="adelanto"
                control={control}
                rules={{
                  required: isRequired("adelanto")
                    ? "El adelanto es obligatorio"
                    : false,
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Adelanto en el credito"
                    fullWidth
                    disabled={!isEditable("adelanto")}
                    error={!!errors.adelanto}
                    helperText={errors.adelanto?.message}
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
                  <TextField
                    {...field}
                    select
                    label="Estado de la deuda"
                    fullWidth
                    disabled={!isEditable("status")}
                    error={!!errors.status}
                    helperText={errors.status?.message}
                    value={field.value || ""}
                  >
                    <MenuItem value="tentativa">Tentativa</MenuItem>
                    <MenuItem value="preAprobada">Pre-Aprobada</MenuItem>
                    <MenuItem value="preparacion">Preparación</MenuItem>
                    <MenuItem value="activa">Activa</MenuItem>
                    <MenuItem value="corregir">Corregir</MenuItem>
                    <MenuItem value="pagada">Pagada</MenuItem>
                    <MenuItem value="en_mora">En Mora</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                    <MenuItem value="anulado">Anulado</MenuItem>
                  </TextField>
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
                <Typography>
                  Periodicidad original: {renewalProposal.debtTerms}
                </Typography>
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
                  <Typography>
                    Cantidad de días del mes original: {renewalProposal.diasMes}
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
    adelanto: debt.adelanto || "no",
    calculationMode: "installments",
    routeId: debt.routeId,
    status: debt.status,
    costumerDocument: debt.costumerDocument,
    type: debt.type,
    capital: debt.capital,
    debtTerms: debt.debtTerms,
    interestRate: debt.interestRate,
    installmentCount: debt.installmentCount,
    startDate: debt.startDate,
    diasMes: debt.diasMes,
    prenda: debt.prenda,
    prendaDescription: debt.prendaDescription,
    prendaValue: debt.prendaValue,
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
    costumerDocument: formValues.costumerDocument,
    type: formValues.type,
    capital: formValues.capital,
    debtTerms: formValues.debtTerms,
    interestRate: formValues.interestRate,
    installmentCount: formValues.installmentCount,
    startDate: formValues.startDate,
    diasMes: formValues.diasMes,

    // la suma del capital mas intereses se hace en el caso de uso
    totalAmount: 0,
  };
}


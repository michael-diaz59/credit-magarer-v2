import { Stack, TextField, MenuItem, Button } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import type Visit from "../../../features/visits/domain/business/entities/Visit";
import { textFieldSX } from "../../atoms/textFieldSX";
import { useEffect, useMemo, useState } from "react";
import { pathOfficeVisits } from "../../../core/helpers/name_routes";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import type { User } from "../../../features/users/domain/business/entities/User";

import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import { Accordion, AccordionDetails, AccordionSummary, Typography, Switch, FormControlLabel, Box } from "@mui/material";

type Props = {
  defaultVisitValues?: Partial<Visit>;
   defaultDebtValues?: Partial<Debt>;
  disabled?: boolean;
  documentCostumer?: string;
  actionLabel: string;
  onSubmit: (visit: Visit, debt?: Omit<Debt, "id">) => void;
};

export const VisitForm = ({
  defaultVisitValues,
  defaultDebtValues,
  disabled,
  actionLabel,
  documentCostumer,
  onSubmit,
}: Props) => {

  const handleMySubmit = (data: Visit & { includeDebt: boolean; debtData: Omit<Debt, "id"> }) => {
    const { includeDebt, debtData, ...visit } = data;
    onSubmit(visit as Visit, includeDebt ? debtData : undefined);
  };

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Visit & { includeDebt: boolean; debtData: Omit<Debt, "id"> }>({
    defaultValues: {
    id: "",
    customerName: "",
    customerDocument: documentCostumer,
    custumerAddres: "",
    customerId: "",
    hasdebt: false,
    observations: "",
    userAssigned: "",
    createdAt: "",
    amountSolicited: 0,
    debitId: "",
    creatorsId: "",
    state: { code: "earring" },

    ...defaultVisitValues,

    includeDebt: defaultDebtValues!==undefined,
    debtData: {
      collectorId: "",
      type: "credito",
      debtTerms: "diario",
      name: "",
      status: "tentativa",
      clientId: "",
      costumerName: "",
      costumerDocument: documentCostumer || "",
      totalAmount: 0,
      installmentCount: 1,
      interestRate: 0,
      startDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString().split("T")[0],
      firstDueDate: "",
      nextPaymentDue: "",
      overdueInstallmentsCount: 0,
      idVisit: "",
      ...defaultDebtValues
    },
  },
  });

  const includeDebt = watch("includeDebt");
  const customerDoc = watch("customerDocument");

  useEffect(() => {
    if (customerDoc) {
      setValue("debtData.costumerDocument", customerDoc);
    }
  }, [customerDoc, setValue]);

  const [collectors, setCollectors] = useState<User[]>([]);
  const [fieldAdvisors, setFieldAdvisors] = useState<User[]>([]);
  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);
  const dispatch = useAppDispatch();
  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userOrchestrator = useMemo(
    () => new UserOrchestrator(dispatch),
    [dispatch],
  );
  useEffect(() => {
    if (documentCostumer) {
      setValue("customerDocument", documentCostumer, {
        shouldValidate: true, // Opcional: para que valide el campo apenas se ponga
        shouldDirty: true     // Opcional: para que el formulario detecte que hubo un cambio
      });
    }
  }, [documentCostumer, setValue]);

  useEffect(() => {
    if (!isOfficeVisit) return;

    console.log("carga de advisors");
    const loadUsers = async () => {
      const orchestrator = new UserOrchestrator(dispatch);

      // Cargar asesores
      const advisorsResult = await orchestrator.getUsersByCompany({
        id: companyId ?? "",
        rol: "FIELD_ADVISOR",
      });

      if (advisorsResult.state.ok) {
        setFieldAdvisors(
          advisorsResult.state.value.filter((user) => user.roles.includes("FIELD_ADVISOR")),
        );
      }

      // Cargar cobradores
      const collectorsResult = await orchestrator.getUsersByCompany({
        id: companyId ?? "",
        rol: "COLLECTOR",
      });

      if (collectorsResult.state.ok) {
        setCollectors(collectorsResult.state.value);
      }
    };

    loadUsers();
  }, [isOfficeVisit, companyId, userOrchestrator]);

  return (
    <form onSubmit={handleSubmit(handleMySubmit)}>
      <Stack spacing={2}>
        {/* Observaciones */}
        <TextField
          label="Observaciones"
          multiline
          rows={3}
          sx={textFieldSX}
          disabled={disabled}
          error={!!errors.observations}
          helperText={errors.observations?.message}
          {...register("observations", {
            maxLength: { value: 500, message: "Máximo 500 caracteres" },
          })}
        />

        {/* Asesor */}
        <Controller
          name="userAssigned"
          control={control}
          rules={{ required: "Debe seleccionar un asesor" }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Asesor de campo"
              sx={textFieldSX}
              disabled={disabled}
              error={!!errors.userAssigned}
              helperText={errors.userAssigned?.message}
            >
              <MenuItem value="">
                <em>Seleccione un asesor</em>
              </MenuItem>

              {fieldAdvisors.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* Documento cliente */}
        <TextField
          label="Cliente (Cédula)"
          sx={textFieldSX}
          disabled={disabled}
          error={!!errors.customerDocument}
          helperText={errors.customerDocument?.message}
          {...register("customerDocument", {
            required: "Documento obligatorio",
          })}
        />

        {/* SECCIÓN DE DEUDA OPCIONAL */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                {...register("includeDebt")}
                checked={includeDebt}
                onChange={(e) => setValue("includeDebt", e.target.checked)}
              />
            }
            label="deuda"
          />
        </Box>

        {includeDebt && (
          <Accordion expanded={true} sx={{ bgcolor: 'action.hover' }}>
            <AccordionSummary expandIcon={<span>▼</span>}>
              <Typography fontWeight="bold">Detalles de la Deuda</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Controller
                  name="debtData.collectorId"
                  control={control}
                  rules={{ required: includeDebt ? "Debe asignar un cobrador" : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      sx={textFieldSX}
                      label="Cobrador asignado"
                      fullWidth
                      error={!!errors.debtData?.collectorId}
                      helperText={errors.debtData?.collectorId?.message}
                    >
                      <MenuItem value=""><em>Seleccione un cobrador</em></MenuItem>
                      {collectors.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="debtData.type"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Tipo" fullWidth sx={textFieldSX}>
                      <MenuItem value="credito">Crédito</MenuItem>
                      <MenuItem value="prenda">Prenda</MenuItem>
                    </TextField>
                  )}
                />

                <Controller
                  name="debtData.debtTerms"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Periodicidad" fullWidth sx={textFieldSX}>
                      <MenuItem value="diario">Diario</MenuItem>
                      <MenuItem value="semanal">Semanal</MenuItem>
                      <MenuItem value="quincenal">Quincenal</MenuItem>
                      <MenuItem value="mensual">Mensual</MenuItem>
                    </TextField>
                  )}
                />

                <TextField
                  label="Monto total"
                  type="number"
                  fullWidth
                  sx={textFieldSX}
                  error={!!errors.debtData?.totalAmount}
                  helperText={errors.debtData?.totalAmount?.message}
                  {...register("debtData.totalAmount", {
                    valueAsNumber: true,
                    required: includeDebt ? "Monto obligatorio" : false,
                    min: { value: 1000, message: "Mínimo 1000" },
                  })}
                />

                <TextField
                  label="Tasa de interés %"
                  type="number"
                  fullWidth
                  sx={textFieldSX}
                  {...register("debtData.interestRate", { valueAsNumber: true })}
                />

                <TextField
                  label="Número de cuotas"
                  type="number"
                  fullWidth
                  sx={textFieldSX}
                  {...register("debtData.installmentCount", { valueAsNumber: true })}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        <Button
          variant="contained"
          type="submit"
        >
          {actionLabel}
        </Button>
      </Stack>
    </form>
  );
};

import { Button, MenuItem, Stack, TextField } from "@mui/material";
import type {
  Debt,
  DebtStatus,
  DebtType,
} from "../../../features/debits/domain/business/entities/Debt";
import type { DebtFormMode } from "./DebtFormMode";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import type { User } from "../../../features/users/domain/business/entities/User";
import { useNavigate } from "react-router-dom";
import { ScreenPaths } from "../../../core/helpers/name_routes";

export type DebtFormAction = "create" | "update" | "preApprove";

export type DebtFormProps = {
  debtId?: string; // 👈 nuevo
  defaultValues: Omit<Debt, "id">;
  mode: DebtFormMode;
  allowedActions: DebtFormAction[];
  onSubmit: (action: DebtFormAction, data: Omit<Debt, "id">) => void;
};

const debtStatusList: DebtStatus[] = [
  "tentativa",
  "preparacion",
  "activa",
  "en_mora",
  "pagada",
  "cancelada",
  "preAprobada",
];

const debtTypes: DebtType[] = ["credito", "prenda"];

export const DebtForm = ({
  debtId,
  defaultValues,
  mode,
  allowedActions,
  onSubmit,
}: DebtFormProps) => {
  const navigate = useNavigate();
  const readOnly = mode === "view";
  const canEditStatus = mode === "audit" || mode === "admin";
  console.log("formulario de deuda");

  const dispatch = useAppDispatch();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [action, setAction] = useState<DebtFormAction | null>(null);
  const [collectors, setCollectors] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Omit<Debt, "id">>({
    defaultValues,
  });

  useEffect(() => {
    if (!companyId || (mode !== "create" && mode !== "audit")) return;

    const loadCollectors = async (): Promise<void> => {
      const orchestrator = new UserOrchestrator(dispatch);

      const result = await orchestrator.getUsersByCompany({
        id: companyId,
        rol: "COLLECTOR",
      });

      if (result.state.ok) {
        setCollectors(result.state.value);
      }
    };

    loadCollectors().catch((error: unknown) => {
      console.error("Error cargando cobradores", error);
    });
  }, [dispatch, mode, companyId]);

  return (
    <form
      onSubmit={handleSubmit(
        (data) => {
          if (!action) {
            console.warn("No hay acción seleccionada");
            return;
          }
          onSubmit(action, data);
        },
        () => {
          if (mode === "audit") {
            window.alert(
              "Esta deuda está corrupta, por favor comunicarse con la administración",
            );
          }
        },
      )}
    >
      <Stack spacing={2}>
        {/* STATUS */}
        {canEditStatus && (
          <Controller
            name="status"
            control={control}
            rules={{ required: "El estado es obligatorio" }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Estado"
                fullWidth
                error={!!errors.status}
                helperText={errors.status?.message}
              >
                {debtStatusList.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}

        {/* COBRADOR */}
        {(canEditStatus || mode === "create") && (
          <Controller
            name="collectorId"
            control={control}
            rules={{ required: "Debe asignar un cobrador" }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Cobrador asignado"
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
        )}

        {/* CÉDULA */}
        <TextField
          label="Cédula del cliente"
          fullWidth
          disabled={mode === "view" || mode === "audit"}
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
          rules={{ required: "El tipo es obligatorio" }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Tipo"
              fullWidth
              disabled={mode === "view"}
              error={!!errors.type}
              helperText={errors.type?.message}
            >
              {debtTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* MONTO */}
        <TextField
          label="Monto total"
          type="number"
          fullWidth
          disabled={mode === "view" || mode === "audit"}
          error={!!errors.totalAmount}
          helperText={errors.totalAmount?.message}
          {...register("totalAmount", {
            valueAsNumber: true,
            required: "Monto obligatorio",
            min: { value: 10001, message: "Debe ser mayor a 10000" },
          })}
        />

        {/* Tasa de inters */}
        <TextField
          label="Tasa de interes %"
          type="number"
          fullWidth
          disabled={mode === "view"}
          error={!!errors.totalAmount}
          helperText={errors.totalAmount?.message}
          {...register("interestRate", {
            valueAsNumber: true,
            required: "Monto obligatorio",
            min: { value: 1, message: "Debe ser mayor a 1%" },
          })}
        />

         {/* Tasa de inters */}
        <TextField
          label="numero de cuotas"
          type="number"
          fullWidth
          disabled={mode === "view"}
          error={!!errors.totalAmount}
          helperText={errors.totalAmount?.message}
          {...register("installmentCount", {
            valueAsNumber: true,
            required: "Monto obligatorio",
            min: { value: 1, message: "Debe ser mayor a 1%" },
          })}
        />

        {/* FECHA */}
        <TextField
          label="Fecha de inicio"
          type="date"
          fullWidth
          disabled={mode === "view" || mode === "audit"}
          InputLabelProps={{ shrink: true }}
          error={!!errors.startDate}
          helperText={errors.startDate?.message}
          {...register("startDate", {
            required: "Fecha obligatoria",
          })}
        />
      </Stack>

      {/* ACTION BUTTONS */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
        {allowedActions.includes("create") && (
          <Button type="submit" onClick={() => setAction("create")}>
            Crear deuda
          </Button>
        )}

        {allowedActions.includes("update") && !readOnly && (
          <Button type="submit" onClick={() => setAction("update")}>
            Actualizar deuda
          </Button>
        )}

        {allowedActions.includes("preApprove") && !readOnly && (
          <Button
            type="submit"
            color="warning"
            onClick={() => setAction("preApprove")}
          >
            Pre-aprobar deuda
          </Button>
        )}
        {/* 🔍 BOTÓN SOLO PARA AUDITOR */}
        {mode === "audit" && debtId && (
          <Button
            variant="outlined"
            color="info"
            onClick={() => navigate(ScreenPaths.auditor.installments(debtId))}
          >
            Ver todas las cuotas
          </Button>
        )}
      </Stack>
    </form>
  );
};

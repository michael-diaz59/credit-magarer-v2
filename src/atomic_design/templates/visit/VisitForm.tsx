import { Stack, TextField, MenuItem, Button } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import type Visit from "../../../features/visits/domain/business/entities/Visit";
import { textFieldSX } from "../../atoms/textFieldSX";
import { useEffect, useMemo, useState } from "react";
import { pathOfficeVisits } from "../../../core/helpers/name_routes";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import type { User } from "../../../features/users/domain/business/entities/User";

type Props = {
  disabled?: boolean;
  documentCostumer?:string,
  actionLabel: string;
  onSubmit: (data: Visit) => void;
};

export const VisitForm = ({
  disabled,
  actionLabel,
  documentCostumer,
  onSubmit,
}: Props) => {

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Visit>({
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
  }, 
  });

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
      const result = await userOrchestrator.getUsersByCompany({
        id: companyId ?? "",
        rol: "FIELD_ADVISOR",
      });

      console.log(result);

      if (result.state.ok) {
        setFieldAdvisors(
          result.state.value.filter((user) => user.roles.includes("FIELD_ADVISOR"), ),
        );
      }
    };

    loadUsers();
  }, [isOfficeVisit, companyId, userOrchestrator]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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

        <Button variant="contained" type="submit">
          {actionLabel}
        </Button>
      </Stack>
    </form>
  );
};

import {
  Box,
  Button,
  Typography,
  Divider,
  CircularProgress,
  TextField,
  Grid,
} from "@mui/material";
import {
  useForm,
  useFieldArray,
  FormProvider,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  emptyPersonalInfo,
  emptyVehicle,
  emptyFamilyReference,
} from "./formFactories";

import { VehicleForm } from "./VehicleForm";
import { FamilyReferenceForm } from "./FamilyReferenceForm";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { CostumerFormMapper } from "../../../features/costumers/wrappers/CostumerFormMapper";
import CustomerOrchestrator from "../../../features/costumers/domain/infraestructure/CustomerOrchestrator";
import { useAppSelector } from "../../../store/redux/coreRedux";
import React, { useEffect } from "react";
import { costumerSchema } from "./SchemasCostumer";
import type z from "zod";
import type { Customer } from "../../../features/costumers/domain/business/entities/Customer";
import { useLocation, useNavigate, useParams } from "react-router";
import { ConfirmDialog } from "../../atoms/ConfirmDialog";
import { BaseDialog } from "../../atoms/BaseDialog";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { UploadDocumentButton } from "../../molecules/UploadDocumentButton";
import {
  CustomerDocumentActions,
  type PendingDocuments,
} from "../../molecules/CustomerDocumentActions";
import type { DocumentTypeG } from "../../../features/costumers/repository/FirebaseCostumerRepository";
export type CostumerFormValues = z.infer<typeof costumerSchema>;

export const CostumerForm = () => {
  const { costumerId } = useParams<{ costumerId?: string }>();
  const { visitId } = useParams<{ visitId?: string }>();
  const [paramsReady, setParamsReady] = React.useState(false);
  const [updateFiles, setUpdateFiles] = React.useState(false);

  /**nombre original usado para validar si se cambio el nombre */
  const originalCustomerNameRef = React.useRef<string | null>(null);

  const location = useLocation();
  const isOfficeVisit = location.pathname.includes(
    ScreenPaths.advisor.office.costumer.costumers,
  );

  const [pendingDocs, setPendingDocs] = React.useState<PendingDocuments>({});

  const handleSelectDocument = (type: DocumentTypeG, file: File) => {
    setUpdateFiles(true);
    setPendingDocs((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  useEffect(() => {
    setParamsReady(true);
  }, []);

  const [costumer, setCostumer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [stillInPage, setstillInPage] = React.useState(true);
  const [baseDIlogOpen, setBaseDIlogOpen] = React.useState(false);
  const [baseDIlogText, setBaseDIlogText] = React.useState("");
  const navigate = useNavigate();

  const userCompanieId: string | undefined = useAppSelector(
    (state) => state.user.user?.companyId,
  );
  const orchestratorRef = React.useMemo(() => {
    return new CustomerOrchestrator();
  }, []);

  const isEditMode = paramsReady && !!costumerId;
  const form = useForm<CostumerFormValues>({
    resolver: zodResolver(costumerSchema),
    defaultValues: {
      id: "",
      debtCounter: 0,
      observations: "",
      applicant: emptyPersonalInfo(),
      coSigner: [emptyPersonalInfo()],
      vehicle: [emptyVehicle()],
      familyReference: [emptyFamilyReference()],
    },
  });

  useEffect(() => {
    console.log("carga de pagina para crear cliente");

    if (!costumerId) return;

    console.log("carga de pagina para editar cliente");

    const load = async () => {
      setLoading(true);
      try {
        const result = await orchestratorRef.getCostumerById(
          userCompanieId ?? "",
          costumerId,
        );

        if (result.ok) {
          setCostumer(result.value);

           originalCustomerNameRef.current =result.value?.applicant.fullName??null;
        }
      } catch {
        setBaseDIlogText(
          "Error: no se pudo obtener la informacion del cliente, intenta de nuevo o contacta a soporte",
        );
        setBaseDIlogOpen(true);
        setstillInPage(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [costumerId, userCompanieId, orchestratorRef]);

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    getValues,
  } = form;

  const coSignerArray = useFieldArray({
    control,
    name: "coSigner",
  });

  const vehicleArray = useFieldArray({
    control,
    name: "vehicle",
  });

  const familyArray = useFieldArray({
    control,
    name: "familyReference",
  });

  useEffect(() => {
    if (!costumer) return;

    form.reset(CostumerFormMapper.toForm(costumer));
  }, [costumer, form]);

  const handleDeleteCostumer = async () => {
    if (!costumerId) {
      return;
    }

    try {
      setLoading(true);
      await orchestratorRef.deleteCostumer({
        companyId: userCompanieId ?? "",
        costumerId: costumerId,
        documentId: costumer?.applicant.idNumber || "",
      });
      setBaseDIlogText("el cliente se elimino con exito");
      setBaseDIlogOpen(true);
      setstillInPage(false);
    } catch (error) {
      console.error("Error eliminando cliente", error);
      setBaseDIlogText(
        "Error: no se pudo eliminar al cliente, intenta denuevo o contacta a soporte",
      );
      setBaseDIlogOpen(true);
      setstillInPage(true);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const onSubmit = async (data: CostumerFormValues) => {
    console.log("llamado a guardar usuario");
    try {
      const costumer: Customer = CostumerFormMapper.toDomain(data);

      console.log("isEditMode" + isEditMode);

      if (isEditMode) {
        costumer.id = costumerId || "";
        const result = await orchestratorRef.updateCostumer({
          costumer: costumer,
          companyId: userCompanieId ?? "",
          idUser: "",
          isNameChange:false,
          updateFiles: updateFiles,
          pendingDocs: pendingDocs,
        });
        if (result.ok) {
          setUpdateFiles(false)
          setBaseDIlogText("el cliente se actualizo con exito");
          setBaseDIlogOpen(true);
          setstillInPage(false);
        } else {
          if (result.error.code === "DOCUMENT_EXISTING") {
            setBaseDIlogText(
              "ya existe un clinete registrado con el numero de documento dado",
            );
            setBaseDIlogOpen(true);
            setstillInPage(true);
            return;
          }
          setBaseDIlogText(
            "error al actualizar la informacion del cliente, intenta de nuevo",
          );
          setBaseDIlogOpen(true);
          setstillInPage(true);
        }
      } else {
        const result = await orchestratorRef.createCostumer({
          companyId: userCompanieId ?? "",
          costumer: costumer,
          updateFiles: updateFiles,
          pendingDocs: pendingDocs,
        });

        if (result.ok) {
          setBaseDIlogText("el cliente se creo con exito");
          setBaseDIlogOpen(true);
          setUpdateFiles(false)
          setstillInPage(false);
        } else {
          if (result.error.code == "DOCUMENT_EXISTING") {
            setBaseDIlogText(
              "ya existe un clinete registrado con el numero de documento dado",
            );
            setBaseDIlogOpen(true);
            setstillInPage(true);
            return;
          }
          setBaseDIlogText("error al crear el cliente, intenta de nuevo");
          setBaseDIlogOpen(true);
          setstillInPage(true);
        }
      }
    } catch (err) {
      console.log(data);
      console.error("Error al guardar cliente", err);
      if (isEditMode) {
        setBaseDIlogText(
          "error al actualizar la informacion del cliente, intenta de nuevo",
        );
        setBaseDIlogOpen(true);
        setstillInPage(true);
      } else {
        setBaseDIlogText("error al crear el cliente, intenta de nuevo");
        setBaseDIlogOpen(true);
        setstillInPage(true);
      }
    }
  };
  if (!paramsReady || loading) {
    return <CircularProgress />;
  }

  return (
    <FormProvider {...form}>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar cliente"
        content="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteCostumer}
      />

      <BaseDialog
        open={baseDIlogOpen}
        body={baseDIlogText}
        butonText="aceptar"
        onClick={() => {
          setBaseDIlogOpen(false);
          setBaseDIlogText("");
          if (!stillInPage) {
            if (isOfficeVisit) {
              if (visitId) {
                navigate(ScreenPaths.advisor.office.visit.visit(visitId));
                return;
              }
              navigate(ScreenPaths.advisor.office.costumer.costumers);
              return;
            }
            if (visitId) {
              navigate(ScreenPaths.advisor.field.visit.visit(visitId));
              return;
            }
            navigate(ScreenPaths.advisor.field.home);
            return;
          }
        }}
      ></BaseDialog>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit, (errors) => {
          const values = getValues();
          console.group("❌ SUBMIT BLOQUEADO POR VALIDACIÓN");

          console.log("📦 Valores actuales del formulario:");
          console.dir(values, { depth: null });

          console.log("🚨 Errores de validación:");
          console.dir(errors, { depth: null });

          console.groupEnd();
        })}
      >
        <Controller
          name="observations"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Observaciones"
              multiline
              rows={3}
              fullWidth
              disabled={!isOfficeVisit}
              sx={{ mt: 3 }}
            />
          )}
        />

        <Typography variant="h4" color="primary">
          Solicitante
        </Typography>
        <Divider sx={{ my: 4 }} />

        <Typography variant="h5">Documentos del cliente</Typography>

        <Grid container spacing={2}>
          <Grid>
            <UploadDocumentButton
              label="Subir cédula"
              type="cedula"
              onSelect={handleSelectDocument}
            />
          </Grid>
          <Grid>
            <CustomerDocumentActions
              label="Cédula"
              type="cedula"
              companyId={userCompanieId ?? ""}
              costumerId={costumerId ?? ""}
              pendingFile={pendingDocs["cedula"]}
            />
          </Grid>

          <Grid>
            <UploadDocumentButton
              label="Subir carta laboral"
              type="carta_laboral"
              onSelect={handleSelectDocument}
            />
          </Grid>
          <Grid>
            <CustomerDocumentActions
              label="Carta laboral"
              type="carta_laboral"
              companyId={userCompanieId ?? ""}
              costumerId={costumerId ?? ""}
              pendingFile={pendingDocs["carta_laboral"]}
            />
          </Grid>
          <Grid>
            <UploadDocumentButton
              label="Subir documento X"
              type="documento_x"
              onSelect={handleSelectDocument}
            />
          </Grid>
          <Grid>
            <CustomerDocumentActions
              label="Documento X"
              type="documento_x"
              companyId={userCompanieId ?? ""}
              costumerId={costumerId ?? ""}
              pendingFile={pendingDocs["documento_x"]}
            />
          </Grid>
        </Grid>

        <PersonalInfoForm control={control} prefix="applicant" />
        <Typography variant="h5">Vehículos</Typography>
        {vehicleArray.fields.map((field, index) => (
          <Box key={field.id}>
            <VehicleForm control={control} index={index} />

            {vehicleArray.fields.length > 1 && (
              <Button
                color="error"
                size="small"
                onClick={() => vehicleArray.remove(index)}
              >
                Quitar vehículo
              </Button>
            )}
          </Box>
        ))}
        <Button onClick={() => vehicleArray.append(emptyVehicle())}>
          Añadir vehículo
        </Button>
        <Divider sx={{ my: 3 }} />

        <Typography variant="h4" color="primary">
          Codeudores
        </Typography>
        {coSignerArray.fields.map((field, index) => (
          <Box key={field.id} sx={{ position: "relative", mb: 3 }}>
            <PersonalInfoForm
              control={control}
              prefix={`coSigner.${index}`}
              index={index}
            />

            {coSignerArray.fields.length > 1 && (
              <Button
                color="error"
                size="small"
                onClick={() => coSignerArray.remove(index)}
              >
                Quitar codeudor
              </Button>
            )}
          </Box>
        ))}
        <Button onClick={() => coSignerArray.append(emptyPersonalInfo())}>
          Añadir codeudor
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h4" color="primary">
          Referencias familiares
        </Typography>
        {familyArray.fields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 3 }}>
            <FamilyReferenceForm control={control} index={index} />

            {familyArray.fields.length > 1 && (
              <Button
                color="error"
                size="small"
                onClick={() => familyArray.remove(index)}
              >
                Quitar referencia
              </Button>
            )}
          </Box>
        ))}
        <Button onClick={() => familyArray.append(emptyFamilyReference())}>
          Añadir referencia
        </Button>

        <Divider sx={{ my: 4 }} />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting || loading}
        >
          Guardar usuario
        </Button>
      </Box>
    </FormProvider>
  );
};

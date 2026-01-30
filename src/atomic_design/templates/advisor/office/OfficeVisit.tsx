import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  Grid,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../store/redux/coreRedux";
import {
  pathOfficeVisits,
  ScreenPaths,
} from "../../../../core/helpers/name_routes";
import { BaseDialog } from "../../../atoms/BaseDialog";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import type { User } from "../../../../features/users/domain/business/entities/User";
import { DebtForm } from "../../debt/DebtFormM";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";

export const OfficeVisit = () => {

  const { visitId } = useParams<{ visitId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);

  const [loading, setLoading] = useState(false);
    const [debtForm, setDebtForm] = useState<Omit<Debt, "id">>({
      name: "",
      collectorId: "",
      clientId: "",
      costumerDocument: "",
      costumerName: "",
      type: "credito",
      idVisit:"",
      debtTerms: "diario",
      status: "tentativa",
      interestRate: 0,
      totalAmount: 0,
      installmentCount: 1,
      startDate: "",
      firstDueDate: "",
      createdAt: new Date().toISOString().split("T")[0],
    });
  const [visitForm, setVisitForm] = useState<Visit>({
    id: "",
    customerName: "",
    customerDocument: "",
    custumerAddres: "",
    customerId: "",
    hasdebt:false,
    observations: "",
    userAssigned: "",
    createdAt: "",
    amountSolicited:0,
    debitId:"",
    creatorsId:"",
    state: { code: "earring" },
  });
  console.log(visitForm);
  const [fieldAdvisors, setFieldAdvisors] = useState<User[]>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [expandDebt, setExpandDebt] = useState(false);
  const [bodyDialogOpen, setBodyDialogOpen] = useState("");

  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userId = useAppSelector((state) => state.user.user?.id || "undefined");
  const [actionButon, setActionButon] = useState("crear visita");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const dispatch = useAppDispatch();

  const userOrchestrator = useMemo(
    () => new UserOrchestrator(dispatch),
    [dispatch]
  );

  /* ------------------- Cargar visita por link ------------------- */
useEffect(() => {
  if (!visitId) return;

  const loadVisit = async () => {
    setLoading(true);

    const result = await visitOrchestrator.getVisitById({
      idCompany: companyId,
      idUser: userId,
      idVisit: visitId,
    });

    if (result.state.ok && result.state.value) {
      setVisitForm(result.state.value);
      setActionButon("actualizar visita");
    } else {
      setBodyDialogOpen("error al cargar visita");
      setErrorDialogOpen(true);
    }

    setLoading(false);

  };

  loadVisit();
}, [visitId, companyId, userId, visitOrchestrator]);

  /* ----------- Cargar FIELD_ADVISORS (solo office) ----------- */
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
          result.state.value.filter((user) =>
            user.roles.includes("FIELD_ADVISOR")
          )
        );
      }
    };

    loadUsers();
  }, [isOfficeVisit, companyId, userOrchestrator]);

const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setDebtForm((prev) => ({
      ...prev,
      [name]:
        name === "totalAmount" ||
        name === "installmentCount" ||
        name === "interestRate"
          ? Number(value)
          : value,
    }));
  };

  //crear visita
  const handleAction = async () => {
    if (!companyId) return;

    if (!visitForm.userAssigned) {
      setBodyDialogOpen("debes seleccionar un asesor para crear una visita");
      setErrorDialogOpen(true);
      return;
    }

    setLoading(true);

 


    /** 🔥 OBJETO FINAL (FUENTE DE LA VERDAD) */
    const visitToSave: Visit = {
      ...visitForm,
      id: visitId ?? visitForm.id,
      state:visitForm.state,
      createdAt: visitForm.createdAt || new Date().toISOString().slice(0, 10),
    };

    let result;

    if (visitId) {
      result = await visitOrchestrator.editVisit({
        idCompany: companyId,
        idUser: userId,
        visit: visitToSave,
      });
    } else {
      result = await visitOrchestrator.createVisit({
        idCompany: companyId,
        idUser: userId,
        visit: visitToSave,
      });
    }

    setLoading(false);

    if (result.state.ok) {
      setVisitForm(visitToSave); // solo para UI
      setBodyDialogOpen(
        visitId ? "visita editada correctamente" : "visita creada correctamente"
      );
    } else {
      if(result.state.error.code==="USER_NOT_FOUND"){
             setBodyDialogOpen("no se encontro un cliente con el documento indicado");
      setErrorDialogOpen(true);
      setLoading(false);
      return
      }
      setBodyDialogOpen("no se pudo guardar la visita");
    }

    setErrorDialogOpen(true);
  };

  const handleVisitChange = <K extends keyof Visit>(field: K, value: Visit[K]) => {
    if (!visitForm) return;

    setVisitForm({
      ...visitForm,
      [field]: value,
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box maxWidth={700} mx="auto" mt={4}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Observaciones"
                multiline
                rows={3}
                value={visitForm.observations}
                disabled={!isOfficeVisit}
                onChange={(e) => handleVisitChange("observations", e.target.value)}
              />

              {/* ----------- Selector FIELD_ADVISOR ----------- */}

              <TextField
                select
                label="Asesor de campo"
                value={
                  fieldAdvisors.some((u) => u.id === visitForm.userAssigned)
                    ? visitForm.userAssigned
                    : ""
                }
                disabled={!isOfficeVisit}
                onChange={(e) => handleVisitChange("userAssigned", e.target.value)}
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

              <TextField
                label="cliente(Cedula)"
                value={visitForm.customerDocument}
                onChange={(e) => {
                  if (!visitForm) return;
                  setVisitForm({
                    ...visitForm,
                    customerDocument: e.target.value,
                  });
                }}
              ></TextField>

              <Stack direction="row" spacing={2} mt={2}>
                {visitForm.state.code==="completed" && (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate(
                        ScreenPaths.advisor.field.visit.Costumer(
                          visitForm.customerId,visitForm.id
                        )
                      )
                    }
                  >
                    Detalles del cliente
                  </Button>
                )}

                {isOfficeVisit && (
                  /**crea o actualiza una visita en base a la existencia de un idVisit */
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleAction();
                    }}
                  >
                    {actionButon}
                  </Button>
                )}

                <Button variant="contained" onClick={() =>setExpandDebt(true)}>
                 agregar deuda
                </Button>
               
              </Stack>
            </Stack>
            <Grid sx={{mt:3}}>
              <Grid>
                 {expandDebt && (
                 
                  DebtForm( { mode:"create",form:debtForm,onChange:(debt)=>{handleChange(debt)}})           
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={errorDialogOpen}
        body={bodyDialogOpen}
        butonText="Aceptar"
        onClick={() => {
          if (
            bodyDialogOpen ===
              "no se encontro un cliente con el documento indicado" ||
            bodyDialogOpen ===
              "debes seleccionar un asesor para crear una visita"
          ) {
            setErrorDialogOpen(false);
          } else {
            setErrorDialogOpen(false);
            if (isOfficeVisit) {
              navigate(ScreenPaths.advisor.office.visit.visits);
            } else {
              navigate(ScreenPaths.advisor.field.visit.visits);
            }
          }
        }}
      />
    </>
  );
};

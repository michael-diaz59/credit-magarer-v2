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

export const FieldVisit = () => {
  const { visitId } = useParams<{ visitId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);

  const [loading, setLoading] = useState(false);
  const [visitForm, setVisitForm] = useState<Visit>({
    id: "",
    customerName: "",
    customerDocument: "",
    customerId: "",
    custumerAddres: "",
    observations: "",
    creatorsId:"",
    amountSolicited: 0,
    userAssigned: "",
    hasdebt:false,
    debitId: "",
    createdAt: "",
    state: { code: "earring" },
  });
  console.log(visitForm);
  const [fieldAdvisors, setFieldAdvisors] = useState<User[]>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const companyId = useAppSelector((state) => state.user.user?.companyId);
  const userId = useAppSelector((state) => state.user.user?.id || "undefined");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const dispatch = useAppDispatch();

  const userOrchestrator = useMemo(
    () => new UserOrchestrator(dispatch),
    [dispatch]
  );

  /* ------------------- Cargar visita ------------------- */
  useEffect(() => {
    console.log("es de oficina?" + isOfficeVisit);
    if (!visitId) return;

    const loadVisit = async () => {
      setLoading(true);
      const result = await visitOrchestrator.getVisitById({
        idCompany: companyId ?? "",
        idUser: userId,
        idVisit: visitId,
      });

      if (result.state.ok) {
        if (result.state.value) {
          setVisitForm(result.state.value);
        } else {
          setErrorDialogOpen(true);
        }
      } else {
        setErrorDialogOpen(true);
      }
      setLoading(false);
    };

    loadVisit();
  }, [visitId, companyId, visitOrchestrator, userId, isOfficeVisit]);

  /* ----------- Cargar FIELD_ADVISORS ----------- */
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

  const handleChange = <K extends keyof Visit>(field: K, value: Visit[K]) => {
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
                label="Nombre del cliente"
                value={visitForm.customerName}
                disabled={!isOfficeVisit}
                onChange={(e) => handleChange("customerName", e.target.value)}
              />

              <TextField
                label="Cédula"
                value={visitForm.customerDocument}
                disabled={!isOfficeVisit}
              />

              <TextField
                label="Dirección"
                value={visitForm.custumerAddres}
                disabled={!isOfficeVisit}
                onChange={(e) => handleChange("custumerAddres", e.target.value)}
              />

              <TextField
                label="Observaciones"
                multiline
                rows={3}
                value={visitForm.observations}
                disabled={!isOfficeVisit}
                onChange={(e) => handleChange("observations", e.target.value)}
              />

              {/* ----------- Selector FIELD_ADVISOR ----------- */}
              {isOfficeVisit && (
                <TextField
                  select
                  label="Asesor de campo"
                  value={visitForm.userAssigned}
                  onChange={(e) => handleChange("userAssigned", e.target.value)}
                >
                  {fieldAdvisors.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Stack direction="row" spacing={2} mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    console.log(
                      "visitForm.id",
                      visitId
                    );
                    navigate(ScreenPaths.advisor.field.visit.Costumer(
                      visitForm.customerId,
                      visitId||""
                    ));
                  }}
                >
                  Detalles del cliente
                </Button>

                {isOfficeVisit && (
                  <Button variant="contained">Crear visita</Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={errorDialogOpen}
        body="Error al cargar la visita"
        butonText="Aceptar"
        onClick={() => setErrorDialogOpen(false)}
      />
    </>
  );
};

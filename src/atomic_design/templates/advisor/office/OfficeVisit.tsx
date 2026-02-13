import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import {
  useAppSelector,
} from "../../../../store/redux/coreRedux";
import {
  pathOfficeVisits,
  ScreenPaths,
} from "../../../../core/helpers/name_routes";
import { BaseDialog } from "../../../atoms/BaseDialog";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import { VisitForm } from "../../visit/VisitForm";

export const OfficeVisit = () => {
  const { visitId } = useParams<{ visitId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);

  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBody, setDialogBody] = useState("");

  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userId = useAppSelector((state) => state.user.user?.id || "undefined");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);

  /* ------------------- Cargar visita ------------------- */
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
        setVisit(result.state.value);
      } else {
        setDialogBody("Error al cargar la visita");
        setDialogOpen(true);
      }

      setLoading(false);
    };

    loadVisit();
  }, [visitId, companyId, userId, visitOrchestrator]);

  /* ------------------- Actualizar visita ------------------- */
  const handleUpdate = async (updatedVisit: Visit) => {
    if (!companyId || !visitId) return;

    setLoading(true);

    const result = await visitOrchestrator.editVisit({
      idCompany: companyId,
      idUser: userId,
      visit: updatedVisit,
    });

    setLoading(false);

    if (result.state.ok) {
      setDialogBody("Visita actualizada correctamente");
    } else if (result.state.error.code === "USER_NOT_FOUND") {
      setDialogBody("No se encontró un cliente con el documento indicado");
    } else {
      setDialogBody("No se pudo actualizar la visita");
    }

    setDialogOpen(true);
  };

  if (loading || !visit) {
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

            <VisitForm
              disabled={!isOfficeVisit}
              defaultVisitValues={visit}
              actionLabel="Actualizar visita"
              documentCostumer={visit.customerDocument}
              onSubmit={(visitData) => handleUpdate(visitData)}
            />

          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={dialogOpen}
        body={dialogBody}
        butonText="Aceptar"
        onClick={() => {
          setDialogOpen(false);

          if (isOfficeVisit) {
            navigate(ScreenPaths.advisor.office.visit.visits);
          } else {
            navigate(ScreenPaths.advisor.field.visit.visits);
          }
        }}
      />
    </>
  );
};

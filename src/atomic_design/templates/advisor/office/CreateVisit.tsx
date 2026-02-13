import { useMemo, useState } from "react";
import { VisitForm } from "../../visit/VisitForm";
import {
  pathOfficeVisits,
  ScreenPaths,
} from "../../../../core/helpers/name_routes";
import { useLocation, useNavigate, useParams } from "react-router";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { Box, Card, CardContent, CircularProgress } from "@mui/material";

export const CreateVisit = () => {
  const { documentCostumer = "" } = useParams<{
    documentCostumer?: string | "";
  }>();
  const location = useLocation();
  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userId = useAppSelector((state) => state.user.user?.id || "undefined");
  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const navigate = useNavigate();

  const [bodyDialogOpen, setBodyDialogOpen] = useState("");

  const isOfficeVisit = location.pathname.includes(pathOfficeVisits);

  const [loading, setLoading] = useState(false);

  //crear visita
  const handleAction = async (data: Visit, debt?: Omit<Debt, "id">) => {
    if (!companyId) return;

    if (!data.userAssigned) {
      setBodyDialogOpen("debes seleccionar un asesor para crear una visita");
      setErrorDialogOpen(true);
      return;
    }

    setLoading(true);

    /** 🔥 OBJETO FINAL (FUENTE DE LA VERDAD) */
    const visitToSave: Visit = {
      ...data,
      id: data.id || crypto.randomUUID(),
      state: data.state,
      createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    };

    let result;
    if (debt) {
      result = await visitOrchestrator.createVisitWithDebt({
        idCompany: companyId,
        idUser: userId,
        visit: visitToSave,
        debt: debt,
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
      setBodyDialogOpen(debt ? "visita y deuda creadas correctamente" : "visita creada correctamente");
    } else {
      if (result.state.error.code === "USER_NOT_FOUND") {
        setBodyDialogOpen(
          "no se encontro un cliente con el documento indicado",
        );
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      setBodyDialogOpen("no se pudo guardar la visita");
    }

    setErrorDialogOpen(true);
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
            {" "}
            <VisitForm
              disabled={!isOfficeVisit}
              actionLabel={"crear"}
              documentCostumer={documentCostumer}
              onSubmit={async (visit, debt) => {
                handleAction(visit, debt);
              }}
            />
          </CardContent>{" "}
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

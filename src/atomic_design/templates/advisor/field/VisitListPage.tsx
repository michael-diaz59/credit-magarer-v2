import {
  Box,
  Grid,
  Typography,
  Fab,
  TextField,
  MenuItem,
  Stack,
  LinearProgress,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";

import { VisitCard } from "./VisitCard";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { BaseDialog } from "../../../atoms/BaseDialog";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";

type SortOrder = "DESC" | "ASC";

export const VisitListPage = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const { documentCostumer } = useParams<{ documentCostumer: string }>();

  const [searchDocument] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const [baseDialogOpen, setBaseDialogOpen] = useState(false);
  const [baseDialogText, setBaseDialogText] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const userCompanyId = useAppSelector(
    (state) => state.user.user?.companyId || "",
  );
  const userId = useAppSelector((state) => state.user.user?.id || "");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);

  // 🚀 Fetch no bloqueante del layout para carga de visitas
  useEffect(() => {
    let mounted = true;

    const fetchVisits = async () => {
      try {
        if (!documentCostumer) {
          return;
        }
        const result = await visitOrchestrator.getVisitsByCustomerDocument({
          idCompany: userCompanyId,
          idUser: userId,
          customerDocument: documentCostumer,
        });

        if (!mounted) return;

        if (result.ok) {
          setVisits(result.value.state);
        } else {
          setVisits([]);
          setBaseDialogText(
            result.error.code === "NETWORK_ERROR"
              ? "Error de conexión. Verifica tu internet."
              : "No se pudieron obtener las visitas.",
          );
          setBaseDialogOpen(true);
        }
      } catch {
        if (!mounted) return;
        setBaseDialogText("Error inesperado obteniendo las visitas.");
        setBaseDialogOpen(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVisits();
    return () => {
      mounted = false;
    };
  }, [userCompanyId, userId, visitOrchestrator]);

  // 🧠 Memo: filtro + orden
  const filteredVisits = useMemo(() => {
    if (!visits.length) return [];

    const normalizedSearch = searchDocument.toLowerCase();

    return [...visits]
      .filter((v) =>
        v.customerDocument.toLowerCase().includes(normalizedSearch),
      )
      .sort((a, b) => {
        const dateA = Date.parse(a.createdAt);
        const dateB = Date.parse(b.createdAt);
        return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
      });
  }, [visits, searchDocument, sortOrder]);

  // 🎯 Handlers memoizados
  const handleVisitClick = useCallback(
    (visit: Visit) => {
      if (
        location.pathname ===
        ScreenPaths.advisor.office.visit.visits2(visit.customerDocument)
      ) {
        navigate(ScreenPaths.advisor.office.visit.visit(visit.id));
        return;
      }
      console.log("no se detecto asesor de oficina");
      navigate(ScreenPaths.advisor.field.visit.visit(visit.id));
    },
    [location.pathname, navigate],
  );

  return (
    <Box p={3}>
      <BaseDialog
        open={baseDialogOpen}
        body={baseDialogText}
        butonText="Aceptar"
        onClick={() => {
          setBaseDialogOpen(false);
          setBaseDialogText("");
          navigate(ScreenPaths.advisor.home);
        }}
      />

      {/* 🧠 LCP temprano */}
      <Typography variant="h4" fontWeight={600} mb={3}>
        Visitas programadas
      </Typography>

      {/* 🔍 Filtros */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField
          select
          label="Ordenar por fecha"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="DESC">Más reciente primero</MenuItem>
          <MenuItem value="ASC">Más antigua primero</MenuItem>
        </TextField>
      </Stack>

      {/* ⏳ Loader no bloqueante */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* 📋 Lista */}
      <Grid container spacing={2}>
        {filteredVisits.map((visit) => (
          <Grid key={visit.id}>
            <VisitCard visit={visit} onClick={() => handleVisitClick(visit)} />
          </Grid>
        ))}
      </Grid>
      {!visits?.length && (
        <Typography color="text.secondary">
          este cliente no tiene visitas
        </Typography>
      )}

      {/* ➕ FAB */}
      {location.pathname === ScreenPaths.advisor.office.visit.visits2(documentCostumer??"") && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => navigate(ScreenPaths.advisor.office.visit.CreateVisit2(documentCostumer??""))}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

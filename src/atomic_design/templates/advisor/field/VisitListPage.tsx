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
import { useLocation, useNavigate } from "react-router-dom";
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

  const [searchDocument, setSearchDocument] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const [baseDialogOpen, setBaseDialogOpen] = useState(false);
  const [baseDialogText, setBaseDialogText] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const userCompanyId = useAppSelector(
    (state) => state.user.user?.companyId || ""
  );
  const userId = useAppSelector((state) => state.user.user?.id || "");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);

  // 🚀 Fetch no bloqueante del layout
  useEffect(() => {
    let mounted = true;

    const fetchVisits = async () => {
      try {
        const result = await visitOrchestrator.getVisits({
          idCompany: userCompanyId,
          idUser: userId,
        });

        if (!mounted) return;

        if (result.state.ok) {
          setVisits(result.state.value);
        } else {
          setVisits([]);
          setBaseDialogText(
            result.state.error.code === "NETWORK_ERROR"
              ? "Error de conexión. Verifica tu internet."
              : "No se pudieron obtener las visitas."
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
        v.customerDocument.toLowerCase().includes(normalizedSearch)
      )
      .sort((a, b) => {
        const dateA = Date.parse(a.createdAt);
        const dateB = Date.parse(b.createdAt);
        return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
      });
  }, [visits, searchDocument, sortOrder]);

  // 🎯 Handlers memoizados
  const handleVisitClick = useCallback(
    (visitId: string) => {
      if (location.pathname === ScreenPaths.advisor.office.visit.visits) {
        navigate(ScreenPaths.advisor.office.visit.visit(visitId));
        return;
      }
      navigate(ScreenPaths.advisor.field.visit.visit(visitId));
    },
    [location.pathname, navigate]
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
          label="Buscar por cédula"
          value={searchDocument}
          onChange={(e) => setSearchDocument(e.target.value)}
          fullWidth
        />

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
            <VisitCard
              visit={visit}
              onClick={() => handleVisitClick(visit.id)}
            />
          </Grid>
        ))}
      </Grid>

      {/* ➕ FAB */}
      {location.pathname === ScreenPaths.advisor.office.visit.visits && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() =>
            navigate(ScreenPaths.advisor.office.visit.CreateVisit)
          }
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};
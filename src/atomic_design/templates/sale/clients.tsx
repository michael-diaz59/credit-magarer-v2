import { Box, Grid, Typography, CircularProgress, Fab } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientCard } from "./ClienteCard";
import CostumerOrchestrator from "../../../features/costumers/domain/infraestructure/CostumerOrchestrator";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Costumer } from "../../../features/costumers/domain/business/entities/Costumer";
import type { Result } from "../../../core/helpers/ResultC";
import type { GetCostumersErrors } from "../../../features/costumers/domain/business/entities/utilities";
import AddIcon from "@mui/icons-material/Add";
import React from "react";
import { BaseDialog } from "../../atoms/BaseDialog";
import {ScreenPaths } from "../../../core/helpers/name_routes";

export const ClientListPage = () => {
  const [costumers, setCostumers] = useState<Costumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseDIlogOpen, setBaseDIlogOpen] = React.useState(false);
  const [baseDIlogText, setBaseDIlogText] = React.useState("");
  const userCompanyId: string = useAppSelector(
    (state) => state.user.user?.companyId || "indefinida"
  );
  const costumerOrchestrator = useMemo(() => new CostumerOrchestrator(), []);

  const navigate = useNavigate();

  console.table(
    costumers.map((c) => ({
      id: c.id,
      applicant: c.applicant?.fullName,
    }))
  );

  useEffect(() => {
    const fetchClients = async () => {
      const data: Result<Costumer[], GetCostumersErrors> =
        await costumerOrchestrator.getCostumers(userCompanyId);

      if (data.ok) {
        setCostumers(data.value);
      } else {
        setCostumers([])
        if (data.error.code === "NETWORK_ERROR") {
          setBaseDIlogText(
            "Error: no se pudo conectar al servidor, valida tu conexion a internet"
          );
        } else {
          setBaseDIlogText(
            "Error: no se pudo obtener la informacion del cliente, intenta denuevo o contacta con soporte"
          );
        }
        setBaseDIlogOpen(true);
      }
      setLoading(false);
    };

    fetchClients();
  }, [userCompanyId, costumerOrchestrator]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
          <BaseDialog
              open={baseDIlogOpen}
              body={baseDIlogText}
              butonText="aceptar"
              onClick={() => {
                setBaseDIlogOpen(false);
                setBaseDIlogText("");
                 navigate(ScreenPaths.advisor.home);
              }}   ></BaseDialog>
      <Typography variant="h4" fontWeight={600} mb={3}>
        clientes
      </Typography>

      <Grid container spacing={2}>
        {costumers.map((costumer) => (
          <Grid key={costumer.id}>
            <ClientCard
              client={costumer}
              onClick={() => {
                navigate(ScreenPaths.advisor.office.costumer.costumer(costumer.id));
              }}
            />
          </Grid>
        ))}
      </Grid>
      {/* ➕ Botón flotante */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => {
          navigate(ScreenPaths.advisor.office.costumer.createCostumer);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

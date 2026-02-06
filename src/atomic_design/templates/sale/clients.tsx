import { Box, Grid, Typography, CircularProgress, Fab, TextField, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientCard } from "./ClienteCard";
import CustomerOrchestrator from "../../../features/costumers/domain/infraestructure/CustomerOrchestrator";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Customer } from "../../../features/costumers/domain/business/entities/Customer";
import type { Result } from "../../../core/helpers/ResultC";
import type { GetCostumersErrors } from "../../../features/costumers/domain/business/entities/utilities";
import AddIcon from "@mui/icons-material/Add";
import React from "react";
import { BaseDialog } from "../../atoms/BaseDialog";
import {ScreenPaths } from "../../../core/helpers/name_routes";

export const ClientListPage = () => {
  const [customers, setCostumers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseDIlogOpen, setBaseDIlogOpen] = React.useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [baseDIlogText, setBaseDIlogText] = React.useState("");
  const userCompanyId: string = useAppSelector(
    (state) => state.user.user?.companyId || "indefinida"
  );
  const costumerOrchestrator = useMemo(() => new CustomerOrchestrator(), []);
    const filteredCustomer = useMemo(() => {
      if (!customers.length) return [];
  
      const normalizedSearch = searchCustomer.toLowerCase();
  
      return [...customers].filter((v) =>
        v.applicant.fullName.toLowerCase().includes(normalizedSearch),
      );
    }, [customers, searchCustomer]);

  const navigate = useNavigate();

  console.table(
    customers.map((c) => ({
      id: c.id,
      applicant: c.applicant?.fullName,
    }))
  );

  useEffect(() => {
    const fetchClients = async () => {
      const data: Result<Customer[], GetCostumersErrors> =
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
         <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField
          label="Buscar por nombre"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          fullWidth
        />
      </Stack>

      <Grid container spacing={2}>
        {filteredCustomer.map((costumer) => (
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

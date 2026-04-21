import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import { DebtForm, mapDebtToForm } from "../../templates/debt/debtForm2";
import { DebtFormDataProvider } from "../../templates/debt/debts/DebtFormDataProvider";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { confirmPaymentConfig } from "../../sub_atomic_particles/debFormConsts";

export const AccountantPendingDeliveryScreen: React.FC = () => {
  const session = useAppSelector((state) => state.user.user);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    if (!session?.companyId) return;
    setLoading(true);
    try {
      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.getByFilters({
        companyId: session.companyId,
        deliveredStatus: "true_preparacion",
      });

      if (result.ok) {
        // Filtramos locamente si es necesario, o mostramos todos los que delivered == false.
        setDebts(result.value.state);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckbox = (debt: Debt, event: React.MouseEvent) => {
    event.stopPropagation();

    if (debt.delivered) return; // 🚫 bloquea selección

    setSelectedDebtIds((prev) =>
      prev.includes(debt.id)
        ? prev.filter((id) => id !== debt.id)
        : [...prev, debt.id]
    );
  };

  const handleDebtClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setDialogOpen(true);
  };

  const handleConfirmSingleDelivery = async () => {
    if (!session?.companyId || !selectedDebt) return;
    setConfirming(true);
    try {
      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.confirmDebtDelivery({
        companyId: session.companyId,
        debtIds: [selectedDebt.id],
      });
      if (result.ok) {
        setDialogOpen(false);
        fetchDebts();
      } else {
        alert("Error al confirmar entrega");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmMultipleDelivery = async () => {
    if (!session?.companyId || selectedDebtIds.length === 0) return;
    setConfirming(true);
    try {
      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.confirmDebtDelivery({
        companyId: session.companyId,
        debtIds: selectedDebtIds,
      });
      if (result.ok) {
        setSelectedDebtIds([]);
        fetchDebts();
      } else {
        alert("Error al confirmar entrega");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Box>
      <Typography>Créditos por Entregar </Typography>
      <Box p={2}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Créditos pendientes: {debts.length}
              </Typography>
              <Button
                variant="contained"
                disabled={selectedDebtIds.length === 0 || confirming}
                onClick={handleConfirmMultipleDelivery}
              >
                {confirming ? (
                  <CircularProgress size={24} />
                ) : (
                  `Confirmar Selección (${selectedDebtIds.length})`
                )}
              </Button>
            </Box>

            <List>
              {debts.map((debt) => (
                <ListItem
                  key={debt.id}
                  onClick={() => handleDebtClick(debt)}
                  sx={{
                    mb: 1,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    boxShadow: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemIcon
                    onClick={(e) => handleToggleCheckbox(debt, e)}
                  >
                    {!debt.delivered && (
                      <Checkbox
                        edge="start"
                        checked={selectedDebtIds.includes(debt.id)}
                        disableRipple
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={debt.name || debt.id}
                    secondary={`Cliente: ${debt.costumerName} | Monto: ${debt.capital} | Estado: ${debt.status}`}
                  />
                </ListItem>
              ))}
              {debts.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No hay créditos pendientes de entrega.
                </Typography>
              )}
            </List>
          </>
        )}
      </Box>

      {/* Modal para ver detalles y confirmar uno solo */}
      <Dialog
        open={dialogOpen}
        onClose={() => !confirming && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalle del Crédito</DialogTitle>
        <DialogContent>
          {selectedDebt && (
            <DebtFormDataProvider>
              {({ routes, loading: loadingConfig }) => {
                if (loadingConfig) return <CircularProgress />;
                return (
                  <Box sx={{ pointerEvents: "none", mt: 3 }}>
                    <DebtForm
                      routes={routes}
                      debValues={mapDebtToForm(selectedDebt)}
                      config={confirmPaymentConfig}
                    />
                  </Box>
                );
              }}
            </DebtFormDataProvider>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={confirming}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmSingleDelivery}
            disabled={confirming || selectedDebt?.delivered === true}

          >
            {confirming ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Confirmar entrega del dinero"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

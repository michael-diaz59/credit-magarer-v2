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
import { DebtForm, mapDebtToForm } from "../debt/debtForm";
import { DebtFormDataProvider } from "../../templates/debt/debts/DebtFormDataProvider";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { confirmPaymentConfig } from "../../sub_atomic_particles/debFormConsts";
import { DisbursementOrchestrator } from "../../../features/anotherPayment/domain/infraestructure/DisbursementOrchestrator";
import type { DisbursementInput } from "../../../features/anotherPayment/domain/business/useCases/disbursement/MarkDisbursementDeliveredAndActivateDebt";

export function debtToDisbursement(debt: Debt, userId: string, userName: string): DisbursementInput {
  return {
    debtName: debt.name,
    amount: debt.amount,
    debtId: debt.id,
    method: "efectivo",
    clientId: debt.clientId,
    clientName: debt.clientName,
    accountantId: userId,
    accountantName: userName,
    routeId: debt.routeId,
    routeName: debt.routeName,
  }
}

export const AccountantPendingDeliveryScreen: React.FC = () => {
  const session = useAppSelector((state) => state.user.user);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  //const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedDisbursements, setSelectedDisbursements] =
    useState<DisbursementInput[]>([]);

  useEffect(() => {
    void fetchDebts();
  }, [session?.companyId]);

  const resetScreen = async () => {
    setSelectedDisbursements([]);
    setSelectedDebt(undefined);
    setDialogOpen(false);

    await fetchDebts();
  };

  const fetchDebts = async () => {
    if (!session?.companyId) return;

    setLoading(true);

    try {
      const orchestrator = new DebtOrchestrator();

      const result = await orchestrator.getDebtsForPreparation({
        companyId: session.companyId,
      });

      if (result.ok) {
        setDebts(result.value.state);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckbox = (
    debt: Debt,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (debt.delivered) return;

    const disbursement = debtToDisbursement(debt, session?.id ?? "", session?.name ?? "");

    setSelectedDisbursements((prev) => {
      const exists = prev.some(
        (item) => item.debtId === debt.id
      );

      return exists
        ? prev.filter(
          (item) => item.debtId !== debt.id
        )
        : [...prev, disbursement];
    });
  };

  const handleDebtClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setDialogOpen(true);
  };

  const handleConfirmDelivery = async (debt: Debt | undefined) => {
    if (!session?.companyId || !selectedDebt || debt === undefined) return;
    setConfirming(true);
    try {
      const orchestrator = new DisbursementOrchestrator();
      const result = await orchestrator.markDisbursementDeliveredAndActivateDebt({
        companyId: session.companyId,
        disbursements: [debtToDisbursement(debt!, session?.id ?? "", session?.name ?? "")],
        debt: [debt]
      });
      if (result.ok) {
        resetScreen()
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
    if (
      !session?.companyId ||
      selectedDisbursements.length === 0
    ) {
      return;
    }

    setConfirming(true);

    try {
      const orchestrator = new DisbursementOrchestrator();

      const selectedDebts = debts.filter((debt) =>
        selectedDisbursements.some(
          (disbursement) =>
            disbursement.debtId === debt.id
        )
      );

      const result =
        await orchestrator.markDisbursementDeliveredAndActivateDebt({
          companyId: session.companyId,
          disbursements: selectedDisbursements,
          debt: selectedDebts,
        });

      if (!result.ok) {
        alert("Error al confirmar entrega");
        return;
      }

      // Limpiar selección
      setSelectedDisbursements([]);
      resetScreen()

      // Recargar información desde Firebase
      await fetchDebts();

    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al confirmar las entregas");
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
                disabled={selectedDisbursements.length === 0 || confirming}
                onClick={handleConfirmMultipleDelivery}
              >
                {confirming ? (
                  <CircularProgress size={24} />
                ) : (
                  `Confirmar Selección (${selectedDisbursements.length})`
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
                        checked={selectedDisbursements.some(
                          (disbursement) => disbursement.debtId === debt.id
                        )}
                        disableRipple
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={debt.name || debt.id}
                    secondary={`Cliente: ${debt.clientName} | Monto: ${debt.capital} | Estado: ${debt.status}`}
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
            onClick={() => handleConfirmDelivery(selectedDebt)}
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

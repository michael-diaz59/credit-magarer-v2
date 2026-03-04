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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../store/redux/coreRedux";
import { BaseDialog } from "../../../atoms/BaseDialog";
import VisitOrchestrator from "../../../../features/visits/domain/infraestructure/VisitOrchestrator";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import type { User } from "../../../../features/users/domain/business/entities/User";
import { textFieldSX } from "../../../atoms/textFieldSX";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

export const FieldVisit = () => {
    const { visitId } = useParams<{ visitId?: string }>();

  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState<Partial<Debt>>({});
  const [collectors, setCollectors] = useState<User[]>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isTentative, setIsTentative] = useState(true);

  const companyId = useAppSelector((state) => state.user.user?.companyId);
  const userId = useAppSelector((state) => state.user.user?.id || "");

  const visitOrchestrator = useMemo(() => new VisitOrchestrator(), []);
  const debtOrchestrator = useMemo(() => new DebtOrchestrator(), []);
  const dispatch = useAppDispatch();
   const navigate = useNavigate();
  const userOrchestrator = useMemo(
    () => new UserOrchestrator(dispatch),
    [dispatch]
  );

  /* ---------------- Cargar visita + deuda ---------------- */
  useEffect(() => {
    if (!visitId) return;

    const loadData = async () => {
      setLoading(true);

      const visitResult = await visitOrchestrator.getVisitById({
        idCompany: companyId ?? "",
        idUser: userId,
        idVisit: visitId,
      });

      if (!visitResult.state.ok || !visitResult.state.value) {
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }

      setVisit(visitResult.state.value);

      const debtResult = await debtOrchestrator.getByFilters({
        companyId: companyId ?? "",
        idVisit: visitId,
      });

      if (debtResult.ok && debtResult.value.state.length > 0) {
        const foundDebt = debtResult.value.state[0];
        setDebt(foundDebt);
        setDebtForm(foundDebt);
        setIsTentative(foundDebt.status === "tentativa");
      }

      setLoading(false);
    };

    loadData();
  }, [visitId, companyId, userId, visitOrchestrator, debtOrchestrator]);

  /* ---------------- Cargar cobradores ---------------- */
  useEffect(() => {
    const loadCollectors = async () => {
      const result = await userOrchestrator.getUsersByCompany({
        id: companyId ?? "",
        rol: "COLLECTOR",
      });

      if (result.state.ok) {
        setCollectors(result.state.value);
      }
    };

    loadCollectors();
  }, [companyId, userOrchestrator]);

  const handleDebtChange = <K extends keyof Debt>(field: K, value: Debt[K]) => {
    setDebtForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateDebt = async (preAprove: boolean) => {
    if (!debt?.id) return;

    setLoading(true);

    const updatedDebt: Debt = {
      ...debt,
      ...debtForm,
      ...(preAprove && { status: "preAprobada" }),
    };

    const result = await debtOrchestrator.updateDebtUse({
      companyId: companyId ?? "",
      isNewCollector: false,
      debt: updatedDebt,
    });

    if (!result.state.ok) {
      setErrorDialogOpen(true);
    } else {
      setDebt(updatedDebt);
      setDebtForm(updatedDebt);
      setIsTentative(updatedDebt.status === "tentativa");

      setSuccessMessage(
        preAprove
          ? "La deuda fue preaprobada correctamente."
          : "La deuda fue actualizada correctamente."
      );

      setSuccessDialogOpen(true);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visit) return null;

  return (
    <>
      <Box maxWidth={700} mx="auto" mt={4}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="Nombre del cliente"
                value={visit.customerName}
                disabled
                sx={textFieldSX}
              />

              <TextField
                label="Cédula"
                value={visit.customerDocument}
                disabled
                sx={textFieldSX}
              />

              <TextField
                label="Dirección"
                value={visit.custumerAddres}
                disabled
                sx={textFieldSX}
              />

              <TextField
                label="Observaciones"
                multiline
                rows={3}
                value={visit.observations}
                disabled
                sx={textFieldSX}
              />
              <Button
              onClick={()=>{
                navigate(ScreenPaths.advisor.field.visit.customer2(visit.customerId))
              }}
              >
                ver detalles del cliente
              </Button>

              {debt && (
                <Accordion expanded sx={{ bgcolor: "action.hover", mt: 2 }}>
                  <AccordionSummary expandIcon={<span>▼</span>}>
                    <Typography fontWeight="bold">
                      Detalles de la Deuda
                    </Typography>
                    {!isTentative && (
                      <Typography ml={2} color="error">
                        No se puede editar la deuda porque no está en estado
                        tentativa.
                      </Typography>
                    )}
                  </AccordionSummary>

                  <AccordionDetails>
                    <Stack spacing={2}>
                      <TextField
                        select
                        disabled={!isTentative}
                        label="Cobrador asignado"
                        value={debtForm.collectorId || ""}
                        onChange={(e) =>
                          handleDebtChange("collectorId", e.target.value)
                        }
                        sx={textFieldSX}
                        fullWidth
                      >
                        <MenuItem value="">
                          <em>Seleccione un cobrador</em>
                        </MenuItem>
                        {collectors.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        select
                        disabled={!isTentative}
                        label="Tipo"
                        value={debtForm.type || "credito"}
                        onChange={(e) =>
                          handleDebtChange(
                            "type",
                            e.target.value as Debt["type"]
                          )
                        }
                        fullWidth
                        sx={textFieldSX}
                      >
                        <MenuItem value="credito">Crédito</MenuItem>
                        <MenuItem value="prenda">Prenda</MenuItem>
                      </TextField>

                      <TextField
                        label="Monto total"
                        type="number"
                        disabled={!isTentative}
                        value={debtForm.totalAmount || 0}
                        onChange={(e) =>
                          handleDebtChange(
                            "totalAmount",
                            Number(e.target.value)
                          )
                        }
                        fullWidth
                        sx={textFieldSX}
                      />

                      <TextField
                        select
                        disabled={!isTentative}
                        label="Periodicidad"
                        value={debtForm.debtTerms || "diario"}
                        onChange={(e) =>
                          handleDebtChange(
                            "debtTerms",
                            e.target.value as Debt["debtTerms"]
                          )
                        }
                        fullWidth
                        sx={textFieldSX}
                      >
                        <MenuItem value="diario">Diario</MenuItem>
                        <MenuItem value="semanal">Semanal</MenuItem>
                        <MenuItem value="quincenal">Quincenal</MenuItem>
                        <MenuItem value="mensual">Mensual</MenuItem>
                      </TextField>

                      <TextField
                        label="Número de cuotas"
                        type="number"
                        disabled={!isTentative}
                        value={debtForm.installmentCount || 1}
                        onChange={(e) =>
                          handleDebtChange(
                            "installmentCount",
                            Number(e.target.value)
                          )
                        }
                        fullWidth
                        sx={textFieldSX}
                      />

                      <TextField
                        label="Tasa de interés %"
                        type="number"
                        disabled={!isTentative}
                        value={debtForm.interestRate || 0}
                        onChange={(e) =>
                          handleDebtChange(
                            "interestRate",
                            Number(e.target.value)
                          )
                        }
                        fullWidth
                        sx={textFieldSX}
                      />

                      <Button
                        variant="contained"
                        disabled={!isTentative}
                        onClick={() => handleUpdateDebt(false)}
                      >
                        Guardar cambios de deuda
                      </Button>

                      <Button
                        variant="contained"
                        disabled={!isTentative}
                        onClick={() => handleUpdateDebt(true)}
                      >
                        PreAprobar deuda
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <BaseDialog
        open={errorDialogOpen}
        body="Ocurrió un error al procesar la solicitud."
        butonText="Aceptar"
        onClick={() => setErrorDialogOpen(false)}
      />

      <BaseDialog
        open={successDialogOpen}
        body={successMessage}
        butonText="Aceptar"
        onClick={() => setSuccessDialogOpen(false)}
      />
    </>
  );
};

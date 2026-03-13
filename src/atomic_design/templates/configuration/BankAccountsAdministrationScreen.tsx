import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Fab
} from "@mui/material";
import { useAppDispatch, useAppSelector, type RootState } from "../../../store/redux/coreRedux";
import { useCallback, useEffect, useMemo, useState } from "react";
import BankAccountOrchestrator from "../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../features/bankAccounts/domain/business/entities/BankAccount";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import type { User } from "../../../features/users/domain/business/entities/User";
import { Delete, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const BankAccountsAdministrationScreen = () => {
  const companyId = useAppSelector((state: RootState) => state.user.user?.companyId);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<Omit<BankAccount, "id">>({
    tope: 0,
    monto: 0,
    name: "",
    bankName: "",
    accountNumber: "",
    accountType: "Ahorros",
    idUser: "",
  });

  const orchestrator = useMemo(() => {
    return new BankAccountOrchestrator();
  }, []);

  const userOrchestrator = useMemo(() => {
    return new UserOrchestrator(dispatch);
  }, [dispatch]);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const [bankAccountsResult, usersResult] = await Promise.all([
      orchestrator.getAll({ companyId }),
      userOrchestrator.getUsersByCompany({ id: companyId })
    ]);

    if (bankAccountsResult.ok) {
      setBankAccounts(bankAccountsResult.value.bankAccounts);
    }

    if (usersResult.state.ok) {
      setUsers(usersResult.state.value);
    }

    setLoading(false);
  }, [companyId, orchestrator, userOrchestrator]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        loadData();
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [loadData]);

  const handleOpenDialog = (account: BankAccount | null = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        tope: account.tope,
        monto: account.monto,
        idUser: account.idUser || "",
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: "",
        bankName: "",
        accountNumber: "",
        accountType: "Ahorros",
        tope: 0,
        monto: 0,
        idUser: "",
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!companyId) return;
    setLoading(true);
    let result;
    if (editingAccount) {
      result = await orchestrator.update({
        companyId,
        bankAccount: { ...formData, id: editingAccount.id },
      });
    } else {
      result = await orchestrator.create({
        companyId,
        bankAccount: formData,
      });
    }

    if (!result.ok) {
      if (result.error.code === "EXCEEDS_LIMIT") {
        alert(
          `La cuenta tiene un tope de $ ${result.error.limit.toLocaleString()}`,
        );
      } else {
        alert("Error al guardar la cuenta bancaria");
      }
      setLoading(false);
      return;
    }

    setOpenDialog(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!companyId || !window.confirm("¿Estás seguro de eliminar esta cuenta?")) return;
    setLoading(true);
    await orchestrator.delete({ companyId, bankAccountId: id });
    await loadData();
  };

  return (
    <Box p={2} sx={{ minHeight: "100vh", position: "relative" }}>
      <Box display="flex" alignItems="center" mb={3} gap={1}>
        <Button variant="text" onClick={() => navigate(-1)}>&larr; Volver</Button>
        <Typography variant="h5">Administración de Cuentas Bancarias</Typography>
      </Box>

      {loading && bankAccounts.length === 0 ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Stack spacing={2}>
          {bankAccounts.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary" align="center" mt={4}>
              No hay cuentas bancarias registradas.
            </Typography>
          )}

          {bankAccounts.map((account) => (
            <Card
              key={account.id}
              variant="outlined"
              sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => handleOpenDialog(account)}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    nombre: {account.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    banco: {account.bankName} - tipo de cuenta: {account.accountType}
                  </Typography>
                  <Typography variant="body2">
                    numero de cuenta: {account.accountNumber}
                  </Typography>
                  <Typography variant="caption" display="block" color="primary" mt={1}>
                    Encargado: {users.find(u => u.id === account.idUser)?.name || "No Asignado"}
                  </Typography>
                  <Typography variant="caption" display="block" fontWeight="bold">
                    Monto Actual: ${account.monto?.toLocaleString() ?? "0"}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Tope Máximo: ${account.tope?.toLocaleString() ?? "0"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <IconButton
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(account.id);
                    }}
                  >
                    <Delete fontSize="medium" />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
      )}

      {/* FAB to create new account */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      >
        <Add />
      </Fab>

      {/* Account Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingAccount ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <TextField
              label="Nombre de referencia"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Nombre del Banco"
              fullWidth
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
            <TextField
              label="Número de Cuenta"
              fullWidth
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            />
            <TextField
              select
              label="Tipo de Cuenta"
              fullWidth
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
            >
              <MenuItem value="Ahorros">Ahorros</MenuItem>
              <MenuItem value="Corriente">Corriente</MenuItem>
            </TextField>
            <TextField
              select
              label="Usuario Encargado"
              fullWidth
              value={formData.idUser}
              onChange={(e) => setFormData({ ...formData, idUser: e.target.value })}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.roles.join(', ')})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tope"
              type="number"
              fullWidth
              value={formData.tope}
              onChange={(e) => setFormData({ ...formData, tope: Number(e.target.value) })}
            />
            <TextField
              label="Monto"
              type="number"
              fullWidth
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
              disabled={!!editingAccount} // Normally, you don't arbitrarily edit the real amount unless it's an adjustment
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.bankName || !formData.accountNumber || !formData.idUser || loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

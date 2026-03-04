import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
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
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import { useNavigate } from "react-router";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import AuthOrchestrator from "../../../features/userAuthentication/domain/infraestructure/AuthOrchestrator";
import { useCallback, useEffect, useMemo, useState } from "react";
import BankAccountOrchestrator from "../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../features/bankAccounts/domain/business/entities/BankAccount";
import { Add, Edit, Delete } from "@mui/icons-material";

export const ProfileScreen = () => {
  const user = useAppSelector((state) => state.user.user);
  const companyId = useAppSelector((state) => state.user.user?.companyId);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null,
  );
  const [formData, setFormData] = useState<Omit<BankAccount, "id">>({
    tope: 0,
    monto: 0,
    name: "",
    bankName: "",
    accountNumber: "",
    accountType: "Ahorros",
  });

  const orchestrator = useMemo(() => {
    return new BankAccountOrchestrator();
  }, []);

  const loadBankAccounts = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);

    const result = await orchestrator.getAll({ companyId });

    if (result.ok) {
      setBankAccounts(result.value.bankAccounts);
    }

    setLoading(false);
  }, [companyId, orchestrator]);

  useEffect(() => {
    if (!user?.roles.includes("ADMIN")) return;

    let active = true;

    const run = async () => {
      await Promise.resolve(); // rompe sincronía directa
      if (active) {
        loadBankAccounts();
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [loadBankAccounts, user?.roles]);

  if (!user) {
    return <Typography>Cargando perfil...</Typography>;
  }

  const isAdmin = user.roles.includes("ADMIN");
  const isCollector = user.roles.includes("COLLECTOR");

  const handleLogout = async () => {
    try {
      const authOrchestrator = new AuthOrchestrator(dispatch);
      const result = await authOrchestrator.logOut?.();
      if (result.ok) {
        navigate(ScreenPaths.log.logIn);
      } else {
        console.log(result.error.code);
      }
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }
  };

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
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!companyId) return;
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
    await loadBankAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!companyId || !window.confirm("¿Estás seguro de eliminar esta cuenta?"))
      return;
    await orchestrator.delete({ companyId, bankAccountId: id });
    await loadBankAccounts();
  };

  return (
    <Box
      p={2}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
      }}
    >
      <Typography variant="h5">Mi perfil</Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <ProfileItem label="Nombre" value={user.name} />
            <ProfileItem label="Correo" value={user.email} />
            <ProfileItem label="Roles" value={user.roles.join(", ")} />

            {isCollector && (
              <>
                <Divider />
                <ProfileItem
                  label="Dinero recolectado"
                  value={`$ ${user.totalAmount?.toLocaleString() ?? "0"}`}
                  highlight
                />
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {isAdmin && (
        <Box mt={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6">Cuentas Bancarias</Typography>
            <IconButton color="primary" onClick={() => handleOpenDialog()}>
              <Add />
            </IconButton>
          </Box>

          {loading && bankAccounts.length === 0 ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={1}>
              {bankAccounts.map((account) => (
                <Card key={account.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {account.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.bankName} - {account.accountType}
                      </Typography>
                      <Typography variant="body2">
                        {account.accountNumber}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        fontWeight="bold"
                      >
                        Monto: ${account.monto?.toLocaleString() ?? "0"} / Tope:
                        ${account.tope?.toLocaleString() ?? "0"}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(account)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
              {bankAccounts.length === 0 && !loading && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No hay cuentas bancarias registradas.
                </Typography>
              )}
            </Stack>
          )}
        </Box>
      )}

      {/* Spacer */}
      <Box flex={1} />

      {/* Logout */}
      <Button
        variant="contained"
        color="error"
        fullWidth
        size="large"
        onClick={handleLogout}
        sx={{ mt: 2 }}
      >
        Cerrar sesión
      </Button>

      {/* Account Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <TextField
              label="Nombre de referencia"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label="Nombre del Banco"
              fullWidth
              value={formData.bankName}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
            />
            <TextField
              label="Número de Cuenta"
              fullWidth
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
            />
            <TextField
              select
              label="Tipo de Cuenta"
              fullWidth
              value={formData.accountType}
              onChange={(e) =>
                setFormData({ ...formData, accountType: e.target.value })
              }
            >
              <MenuItem value="Ahorros">Ahorros</MenuItem>
              <MenuItem value="Corriente">Corriente</MenuItem>
            </TextField>
            <TextField
              label="Tope"
              type="number"
              fullWidth
              value={formData.tope}
              onChange={(e) =>
                setFormData({ ...formData, tope: Number(e.target.value) })
              }
            />
            <TextField
              label="Monto"
              type="number"
              fullWidth
              value={formData.monto}
              onChange={(e) =>
                setFormData({ ...formData, monto: Number(e.target.value) })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.name || !formData.bankName || !formData.accountNumber
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ProfileItem = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant={highlight ? "h6" : "body1"}
      fontWeight={highlight ? 600 : 400}
    >
      {value}
    </Typography>
  </Box>
);

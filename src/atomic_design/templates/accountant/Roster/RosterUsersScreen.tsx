
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import { useAppDispatch, useAppSelector } from "../../../../store/redux/coreRedux";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import { type User } from "../../../../features/users/domain/business/entities/User";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  OFFICE_ADVISOR: "Asesor de Oficina",
  FIELD_ADVISOR: "Asesor de Campo",
  COLLECTOR: "Cobrador",
  AUDITOR: "Auditor",
  ACCOUNTANT: "Contador",
};

export const RosterUsersScreen = () => {
  const companyId = useAppSelector((state) => state.user.user?.companyId) || "";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const userOrchestrator = useMemo(() => new UserOrchestrator(dispatch), []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        const result = await userOrchestrator.getUsersByCompany({ id: companyId });
        if (result.state.ok) {
          console.log(result.state.value);
          const safeUsers = result.state.value.map((u) => ({
            ...u,
            name: u.name ?? "",
            email: u.email ?? "",
          }));
          setUsers(safeUsers);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [companyId, userOrchestrator]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={3}>
        Nómina - Usuarios
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar usuario por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toString())}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
          {filteredUsers.map((user, index) => (
            <React.Fragment key={user.id}>
              <ListItem
                alignItems="flex-start"
                onClick={() => navigate(ScreenPaths.accountant.rosterDetail(user.id))}
                sx={{
                  py: 2,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ mt: 1 }}>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="h6" fontWeight="bold" component="div">
                      {user.name}
                    </Typography>
                  }
                  secondary={
                    <Box component="span">
                      <Typography variant="body2" color="text.secondary" component="span">
                        {user.email}
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {user.roles.map((role) => (
                          <Chip
                            key={role}
                            label={roleLabels[role] || role}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        ))}
                      </Stack>
                    </Box>
                  }
                  slotProps={{
                    secondary: {
                      component: "div",
                    }
                  }}
                />
              </ListItem>
              {index < filteredUsers.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
          {filteredUsers.length === 0 && (
            <Box p={4} textAlign="center">
              <Typography color="text.secondary">No se encontraron usuarios.</Typography>
            </Box>
          )}
        </List>
      </Card>
    </Box>
  );
};

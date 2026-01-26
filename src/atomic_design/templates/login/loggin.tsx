// login/LoginView.tsx
import * as React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material";
import { useFormContext } from "react-hook-form";
import type { LoginFormValues } from "../../../routes/login/LoginController";

interface LoginViewProps {
  onSubmit: (data: LoginFormValues) => void;
}

export function LoginView({ onSubmit }: LoginViewProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  //extraccion de datos globales, se consumen con el useFormContext
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<LoginFormValues>();

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LockOutlined sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" fontWeight={600}>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in with your email and password
          </Typography>
        </Box>
{/* handleSubmit: valida el formulario si hay errores no llama a onSubmit*/}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
           {/* helperText: ayuda a manejar el mostrador de mensajes de error */}
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email", {
              required: "Email is required",
            })}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password", {
              required: "Password is required",
            })}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((p) => !p)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
  {/* isSubmitting: ayuda a evitar clicks dobles inabilitando el boton al procesar datos*/}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={isSubmitting}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

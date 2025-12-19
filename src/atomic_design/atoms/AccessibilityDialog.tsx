import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "../../store/redux/coreRedux";
import { CustomSx } from "../sub_atomic_particles/Custom_sx";
import { setContrast } from "../../store/theme/themeSlice";
import ThemeSwitch from "./ThemeSwitch";

export default function AccessibilityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const contrast = useAppSelector((state) => state.theme.contrast);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            // Ajusta opacidad y desenfoque del fondo web
            backgroundColor: alpha(theme.palette.background.default,CustomSx.basic.trasparent.backgrounds),
            backdropFilter: CustomSx.basic.backdropFilter,
          },
        },
        paper: {
              // Ajusta opacidad y desenfoque del fondo del dialog
          sx: {
            borderRadius: 4,
            backgroundColor:alpha(theme.palette.background.default, CustomSx.basic.trasparent.backgroundsElements),
            px: 2,
            py: 1,
            transition: "all 0.3s ease",
          },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
        Opciones de Accesibilidad
      </DialogTitle>

      <DialogContent dividers  sx={{borderColor: theme.palette.text.primary}}>
        {/* 🌗 Cambiar tema */}
        <Box display="flex" justifyContent="center" mb={2}>
          <ThemeSwitch />
        </Box>

        {/* 🎨 Control del contraste */}
        <FormControl component="fieldset" sx={{ width: "100%", px: 1 }}>
          <FormLabel component="legend">Contraste</FormLabel>
          <RadioGroup
            value={contrast}
            onChange={(e) =>
              dispatch(
                setContrast(e.target.value as "normal" | "medium" | "high")
              )
            }
          >
            <FormControlLabel
              value="normal"
              control={<Radio />}
              label="Normal"
            />
            <FormControlLabel
              value="medium"
              control={<Radio />}
              label="Medio"
            />
            <FormControlLabel value="high" control={<Radio />} label="Alto" />
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center" }}>
        <Button variant="contained" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

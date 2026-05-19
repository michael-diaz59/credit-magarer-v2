import React, { useState, useRef } from "react";
import { Box, Typography, Button, TextField, CircularProgress, useTheme } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { importDebtFromExcel } from "../../../features/debits/scripts/createDebtExcel";

export const UploadExcelScreen: React.FC = () => {
  const theme = useTheme();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");
  const [idRoute, setIdRoute] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Por favor selecciona un archivo Excel." });
      return;
    }
    if (!idRoute.trim()) {
      setMessage({ type: "error", text: "El ID de la ruta es obligatorio." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await importDebtFromExcel(file, {
        companyId,
        idRoute,
        collectorId: "", // Ya no parece requerirse con la nueva lógica, pero lo enviamos vacío
      });
      setMessage({ type: "success", text: "Importación completada exitosamente. Revisa la consola para más detalles." });
      setFile(null);
      setIdRoute("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: error?.message || "Ocurrió un error al procesar el archivo." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4, backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Cargue de datos Excel
      </Typography>

      <Typography variant="body1" paragraph>
        Por favor ingrese el ID de la ruta correspondiente y seleccione el archivo Excel con las deudas a importar.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}>
        <TextField
          label="ID de la Ruta"
          variant="outlined"
          fullWidth
          value={idRoute}
          onChange={(e) => setIdRoute(e.target.value)}
          placeholder="Ej: ROUTE-1234"
        />

        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ py: 1.5, borderStyle: "dashed", borderWidth: 2 }}
        >
          {file ? `Archivo: ${file.name}` : "Seleccionar archivo Excel"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm,.xls"
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {message && (
          <Typography
            variant="body2"
            fontWeight="bold"
            color={message.type === "success" ? "success.main" : "error.main"}
          >
            {message.text}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleUpload}
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "Cargar y Ejecutar"}
        </Button>
      </Box>
    </Box>
  );
};

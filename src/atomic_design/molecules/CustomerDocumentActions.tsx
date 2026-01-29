import { Box, Button, CircularProgress, Typography } from "@mui/material";
import React from "react";

import {
  customerDocumentExists,
  getCustomerDocumentUrl,
  type DocumentTypeG,
} from "../../features/costumers/repository/FirebaseCostumerRepository";

type Props = {
  label: string;
  type: DocumentTypeG;
  companyId: string;
  costumerId?: string;
  pendingFile?: File;
};

// types/CustomerDocuments.ts
export type PendingDocuments = Partial<Record<DocumentTypeG, File>>;





/**componente para el cargado y guardado de datos */
export const CustomerDocumentActions = ({
  label,
  type,
  companyId,
  costumerId,
  pendingFile,
}: Props) => {
  const [exists, setExists] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);

  const check = async () => {
    try {
      const ok = await customerDocumentExists({
        companyId,
        costumerId: costumerId!,
        type,
      });
      setExists(ok);
    } catch {
      setExists(false);
    }
  };

  React.useEffect(() => {
    if (!companyId || !costumerId) {
      setExists(false);
      return;
    }
    check();
  }, [companyId, costumerId]);

  // 🟡 Documento seleccionado pero no subido
  if (pendingFile) {
    return (
      <Typography variant="caption" color="warning.main">
        {label}: pendiente por guardar
      </Typography>
    );
  }

  // 🆕 Cliente aún no existe
  if (!costumerId) {
    return (
      <Typography variant="caption" color="text.secondary">
        {label}: disponible después de crear el cliente
      </Typography>
    );
  }

  if (exists === null) {
    return <CircularProgress size={18} />;
  }

  if (!exists) {
    return (
      <Typography variant="caption" color="text.secondary">
        {label}: no cargado
      </Typography>
    );
  }

  const open = async () => {
    try {
      setLoading(true);
      const url = await getCustomerDocumentUrl({
        companyId,
        costumerId,
        type,
      });
      window.open(url, "_blank");
    } catch {
      alert("No se pudo abrir el documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2">{label}</Typography>
      <Button size="small" onClick={open} disabled={loading}>
        Ver
      </Button>
    </Box>
  );
};

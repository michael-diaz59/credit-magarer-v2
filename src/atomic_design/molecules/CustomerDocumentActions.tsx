import { Box, Button, CircularProgress, Typography } from "@mui/material";
import React from "react";

import { customerDocumentExists, getCustomerDocumentUrl, type DocumentTypeG } from "../../features/costumers/repository/FirebaseCostumerRepository";

type Props = {
  label: string;
  type: DocumentTypeG;
  companyId: string;
  costumerId: string;
};

export const CustomerDocumentActions = ({
  label,
  type,
  companyId,
  costumerId,
}: Props) => {
  const [exists, setExists] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);

  const check = async () => {
    try {
      const ok = await customerDocumentExists({
        companyId,
        costumerId,
        type,
      });
      setExists(ok);
    } catch {
      setExists(false);
    }
  };

  React.useEffect(() => {
    if (!companyId || !costumerId) return;
    check();
  }, [companyId, costumerId]);

  const open = async (download = false) => {
    try {
      setLoading(true);
      const url = await getCustomerDocumentUrl({
        companyId,
        costumerId,
        type,
      });

      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}.pdf`;
        a.click();
      } else {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo abrir el documento");
    } finally {
      setLoading(false);
    }
  };

  if (exists === null) {
    return <CircularProgress size={20} />;
  }

  if (!exists) {
    return (
      <Typography variant="caption" color="text.secondary">
        {label}: No cargado
      </Typography>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2">{label}</Typography>

      <Button size="small" onClick={() => open(false)} disabled={loading}>
        Ver
      </Button>

      <Button size="small" onClick={() => open(true)} disabled={loading}>
        Descargar
      </Button>
    </Box>
  );
};

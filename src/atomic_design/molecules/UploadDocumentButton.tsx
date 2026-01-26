import { Button, CircularProgress } from "@mui/material";
import React from "react";
import { FirebaseCostumerRepository, type DocumentTypeG } from "../../features/costumers/repository/FirebaseCostumerRepository";

type Props = {
  label: string;
  type: DocumentTypeG;
  companyId: string;
  costumerId: string;
};

export const UploadDocumentButton = ({
  label,
  type,
  companyId,
  costumerId,
}: Props) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSelectFile = async (file: File) => {
    try {

        const firebaseCostumer: FirebaseCostumerRepository= new FirebaseCostumerRepository()
      setLoading(true);
      await firebaseCostumer.uploadCustomerDocument({
        companyId,
        costumerId,
        file,
        type,
      });
      alert(`${label} subido correctamente ✅`);
    } catch (err) {
      console.error(err);
      alert(`Error subiendo ${label}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="application/pdf,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
        }}
      />

      <Button
        variant="outlined"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <CircularProgress size={20} /> : label}
      </Button>
    </>
  );
};

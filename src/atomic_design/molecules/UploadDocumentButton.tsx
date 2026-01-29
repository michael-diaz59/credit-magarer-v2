import { Button } from "@mui/material";
import { type DocumentTypeG } from "../../features/costumers/repository/FirebaseCostumerRepository";

type Props = {
  label: string;
  type: DocumentTypeG;
  onSelect: (type: DocumentTypeG, file: File) => void;
};

export function UploadDocumentButton({ label, type, onSelect }: Props) {
  return (
    <Button component="label" variant="outlined">
      {label}
      <input
        type="file"
        hidden
        accept="application/pdf,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onSelect(type, file);
          }
        }}
      />
    </Button>
  );
}

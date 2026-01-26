import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

interface BaseDialogProps {
  open: boolean;
  title?: string;
  body: string;
  onClick: () => void | Promise<void>;
  butonText?: string;
}

export const BaseDialog = ({
  open,
  title,
  body,
  onClick,
  butonText,
}: BaseDialogProps) => {
  return (
    <Dialog open={open} onClose={onClick} maxWidth="xs" fullWidth>
      {title && <DialogTitle>{title}</DialogTitle>}

      <DialogContent>
        <DialogContentText>{body}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClick} color="inherit">
          {butonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
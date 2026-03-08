import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

interface BaseDialogProps {
  open: boolean;
  title?: string;
  body: React.ReactNode;
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
        {typeof body === "string" ? (
          <DialogContentText>{body}</DialogContentText>
        ) : (
          <Box>{body}</Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClick} color="inherit">
          {butonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
import { Box, CircularProgress, Typography, Fade } from "@mui/material";

type Props = {
  open: boolean;
  text?: string;
};

export const LoadingOverlay = ({ open, text = "Actualizando..." }: Props) => {
  return (
    <Fade in={open} timeout={200}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(255,255,255,0.7)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          borderRadius: 2,
        }}
      >
        <CircularProgress size={42} />
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      </Box>
    </Fade>
  );
};

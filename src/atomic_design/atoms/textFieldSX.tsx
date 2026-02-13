import type { SxProps, Theme } from "@mui/material";

export const textFieldSX: SxProps<Theme> = {
  /* BORDE NORMAL */
  "& .MuiOutlinedInput-root": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "secondary.main",
    },

    /* HOVER */
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "secondary.light",
    },

    /* FOCUS */
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
      borderWidth: 2,
    },
  },

  /* TEXTO */
  "& .MuiInputBase-input": {
    color: "text.primary",
  },

  /* LABEL */
  "& .MuiInputLabel-root": {
    color: "text.secondary",
  },

  /* DISABLED FIX */
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: (theme: Theme) => theme.palette.error.main,
  },
};



export const textFieldmt3SX: SxProps<Theme> = {
    mt: 3 ,
  /* BORDE NORMAL */
  "& .MuiOutlinedInput-root": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "secondary.main",
    },

    /* HOVER */
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "secondary.light",
    },

    /* FOCUS */
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
      borderWidth: 2,
    },
  },

  /* TEXTO */
  "& .MuiInputBase-input": {
    color: "text.primary",
  },

  /* LABEL */
  "& .MuiInputLabel-root": {
    color: "text.secondary",
  },

  /* DISABLED FIX */
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: (theme: Theme) => theme.palette.error.main,
  },
};
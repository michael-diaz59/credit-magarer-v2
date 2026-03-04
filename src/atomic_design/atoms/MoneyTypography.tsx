import { Typography, type TypographyProps } from "@mui/material";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";

type MoneyTypographyProps = {
  label: string;
  value: number;
  strong?: boolean;
} & Omit<TypographyProps, "children">;



export function MoneyTypography({
  label,
  value,
  strong = true,
  ...typographyProps
}: MoneyTypographyProps) {
  return (
    <Typography {...typographyProps}>
      {label}{" "}
      {strong ? (
        <strong>${FormatNumberToMoney(value)}</strong>
      ) : (
        `$${FormatNumberToMoney(value)}`
      )}
    </Typography>
  );
}
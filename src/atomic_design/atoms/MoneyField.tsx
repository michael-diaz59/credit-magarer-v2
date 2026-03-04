import { TextField, type TextFieldProps } from "@mui/material";
import { Controller, type Control, type FieldValues, type Path, type RegisterOptions } from "react-hook-form";
import FormatNumberToMoney from "../sub_atomic_particles/FormatNumberToMoney";

type MoneyFieldProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label: string;
  rules?: RegisterOptions<T, Path<T>>;
} & Omit<TextFieldProps, "name" | "value" | "onChange">;


export function MoneyField<T extends FieldValues>({
  name,
  control,
  label,
  rules,
  ...textFieldProps
}: MoneyFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          label={label}
          fullWidth
          value={FormatNumberToMoney(field.value)}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          onChange={(e) => {
            const raw = e.target.value.replace(/\./g, "");
            const numericValue = Number(raw);
            field.onChange(isNaN(numericValue) ? 0 : numericValue);
          }}
        />
      )}
    />
  );
}
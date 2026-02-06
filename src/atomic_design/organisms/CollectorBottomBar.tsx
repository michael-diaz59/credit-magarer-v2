import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";

import DoneAllIcon from "@mui/icons-material/DoneAll";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import MoneyOffRounded from "@mui/icons-material/MoneyOffRounded";

export type CollectorHomeTab = "to_collect" | "collected" | "to_pay";


export interface CollectorBottomBarProps {
  value: CollectorHomeTab;
  onChange: (value: CollectorHomeTab) => void;
}

export const CollectorBottomBar = ({
  value,
  onChange,
}: CollectorBottomBarProps) => {
  return (
    <Paper elevation={8}>
      <BottomNavigation
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        showLabels
      >
        <BottomNavigationAction
          label="Por cobrar"
          value="to_collect"
          icon={<MonetizationOnIcon />}
        />
        <BottomNavigationAction
          label="Cobrados"
          value="collected"
          icon={<DoneAllIcon />}
        />

          <BottomNavigationAction
          label="desembolsos"
          value="to_pay"
          icon={<MoneyOffRounded />}
        />
      </BottomNavigation>
    </Paper>
  );
};
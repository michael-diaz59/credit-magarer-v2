import { Box, Typography } from "@mui/material";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { CustomerList } from "../../atoms/CustomerList";

export const AccountantCustomers = () => {

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Clientes
      </Typography>

      <CustomerList
        navigateTo={(customerDocument) => {
          return ScreenPaths.accountant.debitsCustomer(customerDocument)
        }

        }
      />
    </Box>
  );
};

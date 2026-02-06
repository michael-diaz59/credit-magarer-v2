import { Box, Typography } from "@mui/material";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { CustomerList } from "../CustomerList";

export const AuditEntryPoint = () => {

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        clientes
      </Typography>
        
      <CustomerList
        navigateTo={(customerDocument) =>{
            return ScreenPaths.auditor.debitsCustomer(customerDocument)
        }

        }
      />
    </Box>
  );
};


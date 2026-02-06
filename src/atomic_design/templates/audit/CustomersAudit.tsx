import { Box, Fab, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import AddIcon from "@mui/icons-material/Add";
import { CustomerList } from "../CustomerList";
import { ScreenPaths } from "../../../core/helpers/name_routes";

export const CustomersAudit = () => {
    
    const location = useLocation();

     const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        visitas por clientes
      </Typography>

      <CustomerList
        navigateTo={(customerId) =>{
            return ScreenPaths.auditor.customer(customerId)
        }

        }
      />
      {location.pathname === ScreenPaths.advisor.office.visit.visits && (
              <Fab
                color="primary"
                aria-label="add"
                sx={{
                  position: "fixed",
                  bottom: 24,
                  right: 24,
                  zIndex: 1000,
                }}
                onClick={() =>
                  navigate(ScreenPaths.advisor.office.visit.CreateVisit)
                }
              >
                <AddIcon />
              </Fab>
            )}
    </Box>
  );
};

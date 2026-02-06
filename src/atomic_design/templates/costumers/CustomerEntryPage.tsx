import { Box, Fab, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import AddIcon from "@mui/icons-material/Add";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { CustomerList } from "../CustomerList";

export const CustomerEntryPage = () => {
    
    const location = useLocation();

     const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        clientes
      </Typography>

      <CustomerList
        navigateTo={(customerDocument,customerId) =>{

          console.log(customerId)
          console.log(customerDocument)
               return ScreenPaths.advisor.office.costumer.costumer(customerId??"")

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

import { Box, Fab, Typography } from "@mui/material";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { CustomerList } from "../../CustomerList";
import { useLocation, useNavigate } from "react-router";
import AddIcon from "@mui/icons-material/Add";

export const CustomerVisitEntryPage = () => {
    
    const location = useLocation();
    const isOffice= location.pathname==ScreenPaths.advisor.office.visit.visits

     const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        visitas por clientes
      </Typography>

      <CustomerList
        navigateTo={(customerId) =>{

            if(isOffice){
                return ScreenPaths.advisor.office.visit.visits2(customerId)
            }else{
                   return ScreenPaths.advisor.field.visit.visits2(customerId)
            }
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

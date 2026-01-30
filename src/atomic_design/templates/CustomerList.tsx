import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../store/redux/coreRedux";
import type { Customer } from "../../features/costumers/domain/business/entities/Customer";
import CustomerOrchestrator from "../../features/costumers/domain/infraestructure/CustomerOrchestrator";
import { BaseDialog } from "../atoms/BaseDialog";
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type CustomerListProps = {
  navigateTo: (customerId: string) => string;
};

export const CustomerList = ({ navigateTo }: CustomerListProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [dialogText, setDialogText] = useState("");

  const filteredCustomer = useMemo(() => {
    if (!customers.length) return [];

    const normalizedSearch = searchCustomer.toLowerCase();

    return [...customers].filter((v) =>
      v.applicant.fullName.toLowerCase().includes(normalizedSearch),
    );
  }, [customers, searchCustomer]);

  const navigate = useNavigate();

  const companyId = useAppSelector((state) => state.user.user?.companyId || "");
  const userId = useAppSelector((state) => state.user.user?.id || "");

  const customerOrchestrator = useMemo(() => new CustomerOrchestrator(), []);

  useEffect(() => {
    let mounted = true;

    const fetchCustomers = async () => {
      try {
        const result = await customerOrchestrator.getCustomersList({
          idCompany: companyId,
          idUser: userId,
        });

        if (!mounted) return;

        if (result.ok) {
          setCustomers(result.value.state);
        } else {
          setDialogText("No se pudieron obtener los clientes.");
          setDialogOpen(true);
        }
      } catch {
        if (!mounted) return;
        setDialogText("Error inesperado cargando los clientes.");
        setDialogOpen(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, [companyId, userId, customerOrchestrator]);

  return (
    <>
      <BaseDialog
        open={dialogOpen}
        body={dialogText}
        butonText="Aceptar"
        onClick={() => setDialogOpen(false)}
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
        <TextField
          label="Buscar por nombre"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          fullWidth
        />
      </Stack>

      <Grid container spacing={2}>
        {filteredCustomer.map((customer) => (
          <Grid key={customer.id}>
            <CustomerCard
              customer={customer}
              onClick={() => navigate(navigateTo(customer.applicant.idNumber))}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

type CustomerCardProps = {
  customer: Customer;
  onClick: () => void;
};

export const CustomerCard = ({ customer, onClick }: CustomerCardProps) => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        minWidth: 260,
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {customer.applicant.fullName}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

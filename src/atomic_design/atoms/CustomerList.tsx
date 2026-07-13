import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../store/redux/coreRedux";
import type { Customer } from "../../features/costumers/domain/business/entities/Customer";
import CustomerOrchestrator from "../../features/costumers/domain/infraestructure/CustomerOrchestrator";
import { BaseDialog } from "./BaseDialog";
import {
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import BadgeIcon from "@mui/icons-material/Badge";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";

type CustomerListProps = {
  navigateTo: (customerDocument: string, customerId?: string) => string;
};

export const CustomerList = ({ navigateTo }: CustomerListProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [dialogText, setDialogText] = useState("");

  const filteredCustomer = useMemo(() => {
    if (!customers.length) return [];

    const normalizedSearch = searchCustomer.toLowerCase().trim();

    if (!normalizedSearch) return customers;

    return customers.filter((c) => {
      const name = c.applicant.fullName.toLowerCase();
      const document = String(c.applicant.idNumber).toLowerCase();

      return (
        name.includes(normalizedSearch) || document.includes(normalizedSearch)
      );
    });
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
          label="Buscar por nombre o cedula"
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          fullWidth
        />
      </Stack>

      <Grid container spacing={2}>

        {filteredCustomer.map((customer) => (
          <Grid key={"GridKey-" + customer.id}>
            <CustomerCard
              key={"CustomerCard-" + customer.id}
              customer={customer}
              onClick={() => {
                navigate(navigateTo(customer.applicant.idNumber, customer.id));
              }}
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

export const CustomerCard = memo(({ customer, onClick }: CustomerCardProps) => {

  const applicant = customer.applicant;

  return (
    <Card
      key={"customerCardIntern-" + customer.id}
      elevation={2}
      sx={{
        borderRadius: 2,
        minWidth: 280,
      }}
    >
      <CardActionArea onClick={onClick}>
        <CardContent>

          {/* HEADER */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >

            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {applicant.fullName}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ color: getCalificationColor(customer.calification) }}
            >
              <StarIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" fontWeight={600}>
                {customer.calification ?? "3"}
              </Typography>
            </Stack>

          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* INFORMACION */}
          <Stack spacing={0.8}>

            <Stack direction="row" spacing={1} alignItems="center">
              <BadgeIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" noWrap>
                Documento: {applicant.idNumber}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" noWrap>
                {applicant.address.address}
              </Typography>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 3 }}
            >
              Barrio: {applicant.address.neighborhood}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                {applicant.phone}
              </Typography>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 3 }}
            >
              numero de creditos: {customer.debtCounter + customer.renovationsCounter}
            </Typography>
            {customer.observations && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <NotesIcon sx={{ fontSize: 16, mt: "2px" }} />
                <Typography
                  variant="body2"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {customer.observations}
                </Typography>
              </Stack>
            )}

          </Stack>

        </CardContent>
      </CardActionArea>
    </Card>
  );
});

const getCalificationColor = (calification?: string) => {

  if (!calification) return "warning.main";

  const value = Number(calification);

  if (value >= 4) return "success.main";
  if (value === 3) return "warning.main";

  return "error.main";
};
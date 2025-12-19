import {
  Box,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { collection, getDocs} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { db } from '../../../store/firebase/firebase';
import { ClientCard } from './ClienteCard';

interface ClientListItem {
  id: string;
  fullName: string;
  idNumber: string;
}




export const ClientListPage = () => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
  const fetchClients = async () => {
    try {
      const customersRef = collection(
        db,
        'companies',
        "U2nrZf9nR9v0zYXrcksr",
        'customer'
      );

      const snap = await getDocs(customersRef);

      const data: ClientListItem[] = snap.docs.map(doc => {
        const customer = doc.data();

        return {
          id: doc.id,
          fullName: customer.name,
          idNumber: customer.cedula ?? '',
        };
      });

      setClients(data);
    } finally {
      setLoading(false);
    }
  };

  fetchClients();
});

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Clients
      </Typography>

      <Grid container spacing={2}>
        {clients.map(client => (
          <Grid
          key={client.id}
          >
            <ClientCard
            
              client={client}
              onClick={() => navigate(`/clients/${client.id}`)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

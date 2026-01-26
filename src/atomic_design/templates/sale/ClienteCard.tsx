import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import type { Costumer } from '../../../features/costumers/domain/business/entities/Costumer';

interface Props {
  client: Costumer
  onClick: () => void;
}

export const ClientCard = ({ client, onClick }: Props) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: '0.2s',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600}>
          {client.applicant?.fullName || 'Unnamed client'}
        </Typography>

        <Box mt={0.5}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            ID: {client.applicant?.idNumber || '-'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

interface Props {
  client: {
    fullName: string;
    idNumber: string;
  };
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
          {client.fullName || 'Unnamed client'}
        </Typography>

        <Box mt={0.5}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            ID: {client.idNumber || '-'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

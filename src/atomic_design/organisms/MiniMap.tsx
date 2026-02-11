import { Box } from "@mui/material";

type MiniMapProps = {
  latitude: number;
  longitude: number;
};

export const MiniMap = ({ latitude, longitude }: MiniMapProps) => {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.002
  },${latitude - 0.002},${longitude + 0.002},${
    latitude + 0.002
  }&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <Box
      height={200}
      borderRadius={2}
      overflow="hidden"
      border="1px solid"
      borderColor="divider"
    >
      <iframe
        title="Ubicación del pago"
        width="100%"
        height="100%"
        src={src}
        style={{ border: 0 }}
      />
    </Box>
  );
};

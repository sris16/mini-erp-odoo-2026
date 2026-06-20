import { Box, Typography, Card, CardContent } from '@mui/material';

export default function BoM() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Bill of Materials (BoM)</Typography>
      <Card><CardContent><Typography>Finished products structure and raw components list will go here.</Typography></CardContent></Card>
    </Box>
  );
}

import { Box, Typography, Card, CardContent } from '@mui/material';

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard Analytics</Typography>
      <Card><CardContent><Typography>Dashboard statistics will go here.</Typography></CardContent></Card>
    </Box>
  );
}

import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const handleLogin = () => {
    localStorage.setItem('token', 'dummy');
    navigate('/dashboard');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
      <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Sign In</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Mini ERP Access</Typography>
          <Button variant="contained" fullWidth onClick={handleLogin}>Mock Login</Button>
        </CardContent>
      </Card>
    </Box>
  );
}

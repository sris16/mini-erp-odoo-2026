import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Avatar,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useAppDispatch, loginThunk } from '../../store';

const schema = yup.object().shape({
  username: yup
    .string()
    .required('Username is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(4, 'Password must be at least 4 characters'),
});

type FormData = yup.InferType<typeof schema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      username: 'admin',
      password: 'admin123',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const resultAction = await dispatch(loginThunk(data));
      if (loginThunk.fulfilled.match(resultAction)) {
        navigate('/dashboard');
      } else {
        setError((resultAction.payload as string) || 'Invalid credentials. Use admin / admin123');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected connection error occurred.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 8px 32px 0 rgba(113, 75, 103, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {/* Avatar Icon */}
          <Avatar
            sx={{
              mx: 'auto',
              mt: -6,
              mb: 2,
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              boxShadow: 2,
            }}
          >
            <LockOutlined />
          </Avatar>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
            Shiv Furniture Works
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to manage your inventory & manufacturing
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('username')}
              fullWidth
              label="Username"
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{ mb: 3 }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 4 }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.2,
                borderRadius: 2,
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
        Default credentials: <strong>admin</strong> / <strong>admin123</strong>
      </Typography>
    </Box>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, CircularProgress, IconButton, InputAdornment, Link } from '@mui/material';
import { adminLogin } from '../services/apiService';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({ username: false, password: false });
  const navigate = useNavigate();

  const validate = () => {
    return username.trim().length >= 3 && password.length >= 6;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const deviceFingerprint = result.visitorId;
      const res = await adminLogin({ username, password, deviceFingerprint });
      localStorage.setItem('token', res.data?.token);
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f6fa' }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" align="center" mb={2}>
          Admin Login
        </Typography>
        <form onSubmit={handleLogin} autoComplete="off">
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, username: true }))}
            fullWidth
            margin="normal"
            autoComplete="username"
            required
            error={touched.username && username.trim().length < 3}
            helperText={touched.username && username.trim().length < 3 ? 'Username must be at least 3 characters' : ''}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, password: true }))}
            fullWidth
            margin="normal"
            autoComplete="current-password"
            required
            error={touched.password && password.length < 8}
            helperText={touched.password && password.length < 8 ? 'Password must be at least 8 characters' : ''}
            inputProps={{ maxLength: 100 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(s => !s)}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Link href="#" underline="hover" color="primary" sx={{ fontSize: 14 }} onClick={e => { e.preventDefault(); alert('Forgot password flow coming soon!'); }}>
              Forgot password?
            </Link>
          </Box>
          {error && <Typography color="error" mt={1}>{error}</Typography>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
            disabled={loading || !validate()}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLogin; 
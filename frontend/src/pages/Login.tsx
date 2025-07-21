import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import { resetPassword } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Alert,
  Divider
} from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import ErrorBoundary from '../components/ErrorBoundary';
import LoginForm from '../components/login/LoginForm';

const Login: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <ErrorBoundary>
      <Container 
        maxWidth="sm" 
        sx={{ 
          py: { xs: 2, sm: 4, md: 6 },
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Fade in={true} timeout={500}>
          <Paper 
            elevation={isMobile ? 2 : 8}
            sx={{ 
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: { xs: 2, sm: 3 },
              width: '100%',
              maxWidth: '450px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: isMobile 
                ? '0 4px 20px rgba(0,0,0,0.1)' 
                : '0 8px 40px rgba(0,0,0,0.12)'
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="center">
              <Box 
                sx={{ 
                  mb: 4, 
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    mx: 'auto',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                  }}
                >
                  <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  fontWeight={700}
                  color="primary"
                  gutterBottom
                >
                  Login
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ maxWidth: '350px', mx: 'auto', lineHeight: 1.6 }}
                >
                  Welcome to AgriConnect! We're excited to have you join our community. Let's get you started with a quick registration.
                </Typography>
              </Box>
              <LoginForm />
            </Box>
          </Paper>
        </Fade>
      </Container>
    </ErrorBoundary>
  );
};

export default Login;
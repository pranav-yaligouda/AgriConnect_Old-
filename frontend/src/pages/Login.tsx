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
import { useFormik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import PhoneAuth from '../components/PhoneAuth';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import api from '../utils/axiosConfig';
import { useMutation } from '@tanstack/react-query';
import { isValidIndianMobile } from '../utils/validatePhone';
import type { ApiErrorResponse } from '../types/api';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

interface LoginFormValues {
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { setToken } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loginError, setLoginError] = useState<string | null>(null);

  // —————————————————————————————
  // Phone-Auth & Reset-Password state
  // —————————————————————————————
  const [phoneNumber, setPhoneNumber] = useState('');           // +91XXXXXXXXXX
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // **Reset-Password specific**
  const [resetMode, setResetMode] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);

  // —————————————————————————————
  // Check if phone exists on server
  // —————————————————————————————
  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(-10);
    return '+91' + digits;
  };

  const digits = phoneNumber.replace(/^\+91/, '');
  const isValidPhone = isValidIndianMobile(phoneNumber);
  const showPhoneError = digits.length > 0 && !isValidIndianMobile(phoneNumber);

  // React Query mutation for phone check
  const phoneCheckMutation = useMutation({
    mutationFn: async (phone: string) => {
      const formattedPhone = formatPhone(phone);
      const res = await api.post<any>('/users/check-phone', { phone: formattedPhone });
      return res.data;
    },
    onSuccess: (data) => {
      setIsRegistered(Boolean(data.exists));
    },
    onError: (err: any) => {
      setIsRegistered(null);
      notify(err.message || t('login.error'), 'error');
    },
  });

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (isValidIndianMobile(phoneNumber)) {
      timeout = setTimeout(() => {
        if (!phoneCheckMutation.isLoading) {
          phoneCheckMutation.mutate(phoneNumber);
        }
      }, 350);
    } else {
      setIsRegistered(null);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [phoneNumber, t]);

  // —————————————————————————————
  // Formik for password login
  // —————————————————————————————
  // React Query mutation for login
  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }: { phone: string; password: string }) => {
      const res = await api.post<any>('/users/login', { phone, password });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        setToken(data.token);
        notify(t('login.success'), 'success');
        setTimeout(() => navigate('/profile', { replace: true }), 300);
      } else {
        setLoginError(t('login.invalidCredentials'));
      }
    },
    onError: (err: any, _variables, context) => {
      if (err.response?.status === 401) {
        setLoginError(t('login.invalidCredentials'));
      } else {
        setLoginError(err.message || t('login.error'));
      }
    },
  });

  const formik = useFormik<LoginFormValues>({
    initialValues: { password: '' },
    validationSchema: Yup.object({
      password: Yup.string()
        .required(t('login.validation.passwordRequired'))
        .min(6, t('login.validation.passwordMinLength'))
    }),
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      setLoginError(null);
      loginMutation.mutate({ phone: phoneNumber, password: values.password });
      helpers.setSubmitting(false);
    }
  });

  // Clear error on input change
  useEffect(() => {
    setLoginError(null);
  }, [formik.values.password]);

  // —————————————————————————————
  // Handle Reset-Password submit
  // —————————————————————————————
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError(t('login.passwordsMismatch'));
      return;
    }
    setLoadingReset(true);
    setPasswordError('');

    try {
      const auth = getAuth();
      const user = auth.currentUser!;
      await updatePassword(user, newPassword);
    const idToken = await user.getIdToken();
    await resetPassword({ phone: phoneNumber, newPassword, idToken });
      notify(t('login.passwordResetSuccess'), 'success');
      await auth.signOut();
      navigate('/login');
    } catch (err: any) {
      setPasswordError(err.message || t('login.resetError'));
    } finally {
      setLoadingReset(false);
    }
  };

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
              {/* Header */}
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
                  {t('login.title')}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ maxWidth: '350px', mx: 'auto', lineHeight: 1.6 }}
                >
                  {isRegistered === true 
                    ? t('login.welcomeBack')
                    : isRegistered === false 
                      ? t('login.welcomeNew')
                      : t('login.subtitle')
                  }
                </Typography>
              </Box>

          {/* Phone Input */}
              <Box sx={{ width: '100%', mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                  {t('login.phone')}
                </Typography>
          <TextField
            fullWidth
            value={phoneNumber.replace(/^\+91/, '')}
            onChange={e => {
              // Only allow up to 10 digits
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setPhoneNumber('+91' + digits);
            }}
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      +91
                    </Typography>
                  </Box>
                </InputAdornment>
              )
            }}
            error={showPhoneError}
            helperText={showPhoneError ? t('login.invalidPhone') : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1rem',
                '&:hover fieldset': {
                  borderColor: 'primary.main'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2
                }
              }
            }}
          />
              </Box>

          {/* Phone-check status */}
          {isValidPhone && (
            <Fade in={true} timeout={300}>
              <Box sx={{ mb: 3, width: '100%' }}>
                {phoneCheckMutation.isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      {t('login.checkingPhone')}
                    </Typography>
                  </Box>
                ) : isRegistered === true ? (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      ✓ {t('login.registeredUser')}
                    </Typography>
                  </Alert>
                ) : isRegistered === false ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {t('login.newUser')}
                    </Typography>
                  </Alert>
                ) : null}
              </Box>
            </Fade>
          )}

          {/* OTP Flow (Sign-up or Reset) */}
          {isValidPhone && isRegistered === false && !resetMode && !phoneCheckMutation.isLoading && (
            <Fade in={true} timeout={400}>
              <Box sx={{ width: '100%' }}>
                <PhoneAuth
                  phoneNumber={phoneNumber}
                  onVerify={(_phone, idToken) => navigate('/register', {
                    state: { fromLogin: true, phone: phoneNumber, fromOTP: true, idToken }
                  })}
                />
              </Box>
            </Fade>
          )}

          {/* Password Login */}
          {isValidPhone && isRegistered === true && !resetMode && !showResetForm && !phoneCheckMutation.isLoading && (
            <Fade in={true} timeout={400}>
              <Box component="form" onSubmit={formik.handleSubmit} width="100%">
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                    {t('login.password')}
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={Boolean(formik.touched.password && (formik.errors.password || loginError))}
                    helperText={formik.touched.password && (formik.errors.password || loginError)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => setShowPassword(!showPassword)}
                            sx={{ color: 'text.secondary' }}
                          >
                            {showPassword ? <VisibilityOff/> : <Visibility/>}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '1rem',
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                </Box>
                <Button 
                  type="submit" 
                  fullWidth 
                  variant="contained" 
                  disabled={formik.isSubmitting}
                  size="large"
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                      boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)'
                    }
                  }}
                >
                  {formik.isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                      {t('login.signingIn')}
                    </>
                  ) : (
                    t('login.submit')
                  )}
                </Button>
              </Box>
            </Fade>
          )}

          {/* Forgot-Password Link */}
          {isValidPhone && isRegistered === true && !resetMode && !showResetForm && !phoneCheckMutation.isLoading && (
            <Fade in={true} timeout={500}>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={() => setResetMode(true)}
                  sx={{ 
                    textTransform: 'none',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'rgba(46, 125, 50, 0.08)'
                    }
                  }}
                >
                  {t('login.forgotPassword')}
                </Button>
              </Box>
            </Fade>
          )}

          {/* OTP Flow for Reset */}
          {resetMode && isValidPhone && (
            <Fade in={true} timeout={400}>
              <Box sx={{ width: '100%' }}>
                <PhoneAuth
                  phoneNumber={phoneNumber}
                  onVerify={(_phone, idToken) => {
                    setResetMode(false);
                    setShowResetForm(true);
                  }}
                />
              </Box>
            </Fade>
          )}

          {/* Reset-Password Form */}
          {showResetForm && (
                <Fade in={true} timeout={400}>
                  <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 3, width: '100%' }}>
                    <Divider sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {t('login.resetPassword')}
                      </Typography>
                    </Divider>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                        {t('login.newPassword')}
                      </Typography>
              <TextField
                type="password"
                fullWidth
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: '1rem',
                            '&:hover fieldset': {
                              borderColor: 'primary.main'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: 2
                            }
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                        {t('login.confirmPassword')}
                      </Typography>
              <TextField
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: '1rem',
                            '&:hover fieldset': {
                              borderColor: 'primary.main'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: 2
                            }
                          }
                        }}
              />
                    </Box>
                    
                    <Button 
                      type="submit" 
                      fullWidth 
                      variant="contained" 
                      disabled={loadingReset}
                      size="large"
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                          boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)'
                        }
                      }}
                    >
                      {loadingReset ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                          {t('login.resettingPassword')}
                        </>
                      ) : (
                        t('login.resetPassword')
                      )}
              </Button>
            </Box>
                </Fade>
          )}
        </Box>
      </Paper>
        </Fade>
    </Container>
    </ErrorBoundary>
  );
};

export default Login;
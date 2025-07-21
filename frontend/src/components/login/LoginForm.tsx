import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Typography, TextField, Button, InputAdornment, IconButton, CircularProgress, Fade, Alert, Divider } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/axiosConfig';
import { isValidIndianMobile } from '../../utils/validatePhone';
import PhoneAuth from './PhoneAuth';
import { useNavigate } from 'react-router-dom';

interface LoginFormValues {
  password: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { setToken } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(''); // +91XXXXXXXXXX
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);

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
        if (!(phoneCheckMutation as any).isPending) {
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

  useEffect(() => {
    setLoginError(null);
  }, [formik.values.password]);

  // Reset password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(t('login.passwordsMismatch'));
      return;
    }
    setLoadingReset(true);
    setPasswordError('');
    try {
      const { getAuth, updatePassword } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser!;
      await updatePassword(user, newPassword);
      const idToken = await user.getIdToken();
      await import('../../services/apiService').then(({ resetPassword }) =>
        resetPassword({ phone: phoneNumber, newPassword, idToken })
      );
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
    <Box display="flex" flexDirection="column" alignItems="center">
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
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
            maxLength: 10,
            'aria-label': t('login.phone'),
            autoComplete: 'tel',
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
            {phoneCheckMutation.isPending ? (
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
      {isValidPhone && isRegistered === false && !resetMode && !phoneCheckMutation.isPending && (
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
      {isValidPhone && isRegistered === true && !resetMode && !showResetForm && !phoneCheckMutation.isPending && (
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
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ color: 'text.secondary' }}
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
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
      {isValidPhone && isRegistered === true && !resetMode && !showResetForm && !phoneCheckMutation.isPending && (
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
  );
};

export default LoginForm; 
import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';              // ← new :contentReference[oaicite:0]{index=0}
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
  CircularProgress
} from '@mui/material';
import { useFormik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import PhoneAuth from '../components/PhoneAuth';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../utils/axiosConfig';
import type { ApiResponse } from './interfaces';
import { useTranslation } from 'react-i18next';

interface LoginFormValues {
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // —————————————————————————————
  // Phone-Auth & Reset-Password state
  // —————————————————————————————
  const [phoneNumber, setPhoneNumber] = useState('');           // +91XXXXXXXXXX
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [loadingPhoneCheck, setLoadingPhoneCheck] = useState(false);
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
  const checkUserExists = async (phone: string) => {
    if (loadingPhoneCheck) return;
    setLoadingPhoneCheck(true);

    try {
      const res = await api.post<ApiResponse>('/users/check-phone', { phone });
      setIsRegistered(Boolean(res.data.exists));
    } catch (err: any) {
      setIsRegistered(null);
      toast.error(err.message || t('login.error'));
    } finally {
      setLoadingPhoneCheck(false);
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (/^\+91\d{10}$/.test(phoneNumber)) {
      timeout = setTimeout(() => checkUserExists(phoneNumber), 350);
    } else {
      setIsRegistered(null);
    }
    return () => clearTimeout(timeout);
  }, [phoneNumber, t]);

  // —————————————————————————————
  // Formik for password login
  // —————————————————————————————
  const formik = useFormik<LoginFormValues>({
    initialValues: { password: '' },
    validationSchema: Yup.object({
      password: Yup.string()
        .required(t('login.validation.passwordRequired'))
        .min(6, t('login.validation.passwordMinLength'))
    }),
    onSubmit: async (values, helpers) => {
      helpers.setSubmitting(true);
      try {
        const res = await api.post<ApiResponse>('/users/login', {
          phone: phoneNumber,
          password: values.password
        });
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
          toast.success(t('login.success'));
          setTimeout(() => navigate('/profile', { replace: true }), 300);
        } else {
          toast.error(t('login.error'));
          helpers.setFieldError('password', t('login.invalidCredentials'));
        }
      } catch (err: any) {
        helpers.setSubmitting(false);
        if (err.response?.status === 401) {
          helpers.setFieldError('password', t('login.invalidCredentials'));
          toast.error(t('login.invalidCredentials'));
        } else {
          toast.error(err.message || t('login.error'));
        }
      } finally {
        helpers.setSubmitting(false);
      }
    }
  });

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
      const user = auth.currentUser!;                    // signed-in via OTP :contentReference[oaicite:1]{index=1}
      await updatePassword(user, newPassword);
    // ⇒ Sync to your backend:
    const idToken = await user.getIdToken();
    await resetPassword({ phone: phoneNumber, newPassword, idToken });
      toast.success(t('login.passwordResetSuccess'));
      await auth.signOut();
      navigate('/login');
    } catch (err: any) {
      setPasswordError(err.message || t('login.resetError'));
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h4" mb={4}>{t('login.title')}</Typography>

          {/* Phone Input */}
          <TextField
            fullWidth
            label={t('login.phone')}
            value={phoneNumber.replace(/^\+91/, '')}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setPhoneNumber('+91' + digits);
            }}
            InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }}
            error={!!phoneNumber && !/^\+91\d{10}$/.test(phoneNumber)}
            helperText={!!phoneNumber && !/^\+91\d{10}$/.test(phoneNumber) ? t('login.invalidPhone') : ''}
            sx={{ mb: 2 }}
          />

          {/* Phone-check status */}
          {phoneNumber && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              {loadingPhoneCheck
                ? <> <CircularProgress size={20}/> <Typography>{t('login.checkingPhone')}</Typography> </>
                : isRegistered === true
                  ? <Typography color="success.main">✓ {t('login.registeredUser')}</Typography>
                  : isRegistered === false
                    ? <Typography color="primary">{t('login.newUser')}</Typography>
                    : null
              }
            </Box>
          )}

          {/* OTP Flow (Sign-up or Reset) */}
          {isRegistered === false && /^\+91\d{10}$/.test(phoneNumber) && (
            <PhoneAuth
              phoneNumber={phoneNumber}
              onVerify={() => navigate('/register', {
                state: { fromLogin: true, phone: phoneNumber, fromOTP: true }
              })}
            />
          )}

          {/* Password Login */}
          {isRegistered === true && /^\+91\d{10}$/.test(phoneNumber) && !resetMode && (
            <Box component="form" onSubmit={formik.handleSubmit} width="100%">
              <TextField
                fullWidth
                name="password"
                label={t('login.password')}
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={Boolean(formik.touched.password && formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff/> : <Visibility/>}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />
              <Button type="submit" fullWidth variant="contained" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? <CircularProgress size={20}/> : t('login.submit')}
              </Button>
            </Box>
          )}

          {/* Forgot-Password Link */}
          {isRegistered === true && !resetMode && /^\+91\d{10}$/.test(phoneNumber) && (
            <Typography
              sx={{ mt: 2, cursor: 'pointer' }}
              color="primary"
              onClick={() => setResetMode(true)}
            >
              {t('login.forgotPassword')}
            </Typography>
          )}

          {/* OTP Flow for Reset */}
          {resetMode && /^\+91\d{10}$/.test(phoneNumber) && (
            <PhoneAuth
              phoneNumber={phoneNumber}
              onVerify={() => {
                setResetMode(false);
                setShowResetForm(true);
              }}
            />
          )}

          {/* Reset-Password Form */}
          {showResetForm && (
            <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 3 }}>
              <TextField
                label={t('login.newPassword')}
                type="password"
                fullWidth
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label={t('login.confirmPassword')}
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                sx={{ mb: 3 }}
              />
              <Button type="submit" fullWidth variant="contained" disabled={loadingReset}>
                {loadingReset ? <CircularProgress size={20}/> : t('login.resetPassword')}
              </Button>
            </Box>
          )}

        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
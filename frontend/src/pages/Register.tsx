import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RegisterUserPayload, RegisterAddress, RegisterResponse } from '../types/api';
import { registerUser, generateUsername, checkUsername, sendEmailOtp, verifyEmailOtp } from '../services/apiService';
import { useTranslation } from 'react-i18next';
import { stateDistricts } from '../data/stateDistricts';
import enGeo from '../locales/en/geo.json';
import hiGeo from '../locales/hi/geo.json';
import knGeo from '../locales/kn/geo.json';
import mrGeo from '../locales/mr/geo.json';
import RegisterStepper from '../components/register/RegisterStepper';
import AccountTypeStep from '../components/register/AccountTypeStep';
import PersonalDetailsStep from '../components/register/PersonalDetailsStep';
import LocationStep from '../components/register/LocationStep';
import FinishStep from '../components/register/FinishStep';
import PasswordStrengthBar from '../components/register/PasswordStrengthBar';
import { useNotification } from '../contexts/NotificationContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axiosConfig';
import { getAuth } from 'firebase/auth';

const roleOptions = [
  { value: 'farmer', label: 'Farmer (Sell your produce)' },
  { value: 'vendor', label: 'Vendor (Buy in bulk for business)' },
  { value: 'user', label: 'Consumer (Buy for personal use)' },
];

const steps = [
  'register.accountType',
  'register.personalDetails',
  'register.location',
  'register.finish',
];

const geoMap: any = {
  en: enGeo,
  hi: hiGeo,
  kn: knGeo,
  mr: mrGeo,
};

const Register = () => {
  const { notify } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const lastCheckedUsername = useRef('');
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const geo = geoMap[i18n.language] || enGeo;
  const [usernameMode, setUsernameMode] = useState<'auto' | 'manual'>('auto');
  const { setToken } = useAuth();
  const idToken = location.state?.idToken;
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [registerButtonClicked, setRegisterButtonClicked] = useState(false);

  // Restrict direct access to register page and enforce phone verification
  useEffect(() => {
    const token = localStorage.getItem('token');
    const state = location.state;
    const isFromLogin = state && state.fromLogin === true;
    const isFromOTP = state && !!state.phone && state.fromOTP === true;
    // Only allow access if redirected from OTP verification with a phone number
    if (!(isFromLogin && isFromOTP)) {
      notify(t('register.phoneVerificationRequired', 'Phone verification required. Please verify your number.'), 'error');
      navigate('/login', { replace: true });
      return;
    }
    // Optionally, check if phone is already registered (extra security)
    // If phone is not present, block registration
    if (!isFromOTP || !state.phone) {
      notify(t('register.phoneVerificationRequired', 'Phone verification required. Please verify your phone number.'), 'error');
      navigate('/login', { replace: true });
    }
  }, [navigate, location.state, notify, t]);

  // Registration mutation
  const registerMutation = useMutation<RegisterResponse, any, RegisterUserPayload>({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      setToken(data.token);
      // Sign out from Firebase after registration (if OTP used)
      try {
        const auth = getAuth();
        if (auth.currentUser) await auth.signOut();
      } catch {}
      notify(t('register.success'), 'success');
      navigate('/profile', { replace: true });
    },
    onError: (error: any) => {
      if (error?.message) {
        notify(error.message || t('register.error'), 'error');
      }
      if (error?.details) {
        Object.values(error?.details).forEach((msg: any) => notify(String(msg), 'error'));
      }
    },
  });

  // Username generation mutation (always use backend)
  const generateUsernameMutation = useMutation<{ username: string }, any, string>({
    mutationFn: generateUsername,
    onMutate: () => setUsernameLoading(true),
    onSuccess: (data) => {
      formik.setFieldValue('username', data.username);
      setUsernameLoading(false);
    },
    onError: (error: any) => {
      notify(error?.message || t('register.usernameGenError'), 'error');
      setUsernameLoading(false);
    },
  });

  const formik = useFormik({
    validateOnMount: true,
    initialValues: {
      role: 'user',
      username: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      street: '',
      district: '',
      state: '',
      zipcode: '', 
    },
    validationSchema: Yup.object({
      role: Yup.string().required(t('register.validation.roleRequired')),
      username: Yup.string()
        .matches(/^[a-zA-Z0-9_]+$/, t('register.validation.usernamePattern'))
        .required(t('register.validation.usernameRequired')),
      name: Yup.string().required(t('register.validation.nameRequired')),
      email: Yup.string().email(t('register.validation.invalidEmail')),
      phone: Yup.string()
        .matches(/^\+?\d{10,15}$/, t('register.validation.phoneInvalid'))
        .required(t('register.validation.phoneRequired')),
      password: Yup.string()
        .min(8, t('register.validation.passwordPattern'))
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/,
          t('register.validation.passwordPattern', 'Password must contain at least one uppercase letter, one lowercase letter, and one digit. Symbols are allowed.')
        )
        .required(t('register.validation.passwordRequired')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('register.validation.passwordsMustMatch'))
        .required(t('register.validation.confirmPasswordRequired')),
      street: Yup.string(),
      district: Yup.string().required(t('register.validation.districtRequired')),
      state: Yup.string().required(t('register.validation.stateRequired')),
      zipcode: Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        if (!idToken) {
          notify(t('register.phoneVerificationRequired', 'Phone verification required. Please verify your phone number.'), 'error');
          setSubmitting(false);
          return;
        }
        let username = values.username;
        if (!username || username.trim() === '') {
          // Always use backend for username generation
          const { username: generatedUsername } = await generateUsernameMutation.mutateAsync(values.name);
          username = generatedUsername;
        }
        // Always lowercase username before submission
        username = username.toLowerCase();
        const address: RegisterAddress = {
          district: values.district,
          state: values.state,
        };
        if (values.street && values.street.trim() !== '') {
          address.street = values.street;
        }
        if (values.zipcode && values.zipcode.trim() !== '') {
          address.zipcode = values.zipcode;
        }
        const cleanPhone = values.phone.startsWith('+91') ? values.phone.slice(3) : values.phone;
        // Add idToken for backend enforcement
        const reqBody: RegisterUserPayload & { idToken: string } = {
          username: username,
          name: values.name,
          password: values.password,
          role: values.role as 'user' | 'farmer' | 'vendor',
          phone: cleanPhone,
          address,
          idToken,
        };
        if (values.email) reqBody.email = values.email;
        setRegisterButtonClicked(true); // Move here, just before sending request
        registerMutation.mutate(reqBody);
      } catch (error: any) {
        setRegisterButtonClicked(false);
        let message = error?.message || t('register.error');
        const errorDetails = error?.details;
        if (errorDetails) {
          Object.keys(errorDetails).forEach(field => {
            if (field === 'username') {
              setFieldError('username', t('register.usernameExists', 'Username already exists. Please choose another.'));
            } else {
              setFieldError(field, errorDetails[field]);
            }
          });
        } else {
          notify(message, 'error');
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (location.state && location.state.phone) {
      formik.setFieldValue('phone', location.state.phone);
    }
  }, [location.state]);

  // Remove profile redirect effect

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam && roleOptions.find(option => option.value === roleParam)) {
      formik.setFieldValue('role', roleParam as 'user' | 'farmer' | 'vendor');
    }
  }, [location.search]);

  useEffect(() => {
    const selectedState = formik.values.state;
    if (selectedState && stateDistricts[selectedState]) {
      if (!stateDistricts[selectedState].includes(formik.values.district)) {
        formik.setFieldValue('district', '');
      }
    } else {
      formik.setFieldValue('district', '');
    }
  }, [formik.values.state]);

  // Auto-generate username on name change (if username untouched and in auto mode)
  useEffect(() => {
    if (usernameMode !== 'auto') return;
    if (!formik.values.name) return;
    setUsernameLoading(true);
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const { username } = await generateUsername(formik.values.name);
        formik.setFieldValue('username', username, false);
        setUsernameAvailable(true);
      } catch (e) {
        setUsernameAvailable(false);
      } finally {
        setUsernameLoading(false);
      }
    }, 400);
    // eslint-disable-next-line
  }, [formik.values.name, usernameMode]);

  // Lowercase username on manual input
  useEffect(() => {
    if (usernameMode !== 'manual') return;
    if (!formik.values.username) return;
    const lower = formik.values.username.toLowerCase();
    if (formik.values.username !== lower) {
      formik.setFieldValue('username', lower, false);
    }
    // eslint-disable-next-line
  }, [formik.values.username, usernameMode]);

  // Check username uniqueness on manual input (only in manual mode)
  useEffect(() => {
    if (usernameMode !== 'manual') return;
    if (!formik.values.username) {
      setUsernameAvailable(null);
      return;
    }
    // Validate username format before checking availability
    const validPattern = /^[a-zA-Z0-9_]{3,20}$/;
    if (!validPattern.test(formik.values.username)) {
      setUsernameAvailable(null);
      formik.setFieldError('username', t('register.validation.usernamePattern', 'Invalid username format.'));
      return;
    }
    if (formik.values.username === lastCheckedUsername.current) return;
    setUsernameLoading(true);
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const { available } = await checkUsername(formik.values.username);
        setUsernameAvailable(available);
        if (!available) formik.setFieldError('username', t('register.usernameExists', 'Username already exists.'));
        else formik.setFieldError('username', undefined);
        lastCheckedUsername.current = formik.values.username;
      } catch (e) {
        setUsernameAvailable(false);
        formik.setFieldError('username', t('register.validation.usernamePattern', 'Invalid username format.'));
      } finally {
        setUsernameLoading(false);
      }
    }, 400);
    // eslint-disable-next-line
  }, [formik.values.username, usernameMode]);

  // When switching to auto mode, clear username and trigger auto-generation
  useEffect(() => {
    if (usernameMode === 'auto') {
      formik.setFieldValue('username', '', false);
      setUsernameAvailable(null);
    }
    // eslint-disable-next-line
  }, [usernameMode]);

  // Helper to get English key from translated district
  const getEnglishDistrict = (stateKey: string, translatedDistrict: string) => {
    const enDistricts = (enGeo.districts as Record<string, string[]>)[stateKey] || [];
    const currentDistricts = (geo.districts as Record<string, string[]>)[stateKey] || [];
    const idx = currentDistricts.indexOf(translatedDistrict);
    return idx !== -1 ? enDistricts[idx] : translatedDistrict;
  };

  // Helper to get the translated district from the English key
  const getTranslatedDistrict = (stateKey: string, englishDistrict: string) => {
    const enDistricts = (enGeo.districts as Record<string, string[]>)[stateKey] || [];
    const currentDistricts = (geo.districts as Record<string, string[]>)[stateKey] || [];
    const idx = enDistricts.indexOf(englishDistrict);
    return idx !== -1 ? currentDistricts[idx] : englishDistrict;
  };

  const handleNext = () => {
    let canProceed = false;
    if (activeStep === 0) {
      canProceed = Boolean(formik.values.role) && !formik.errors.role;
    } else if (activeStep === 1) {
        canProceed = Boolean(
          formik.values.username &&
          formik.values.name &&
          formik.values.phone &&
          formik.values.password &&
          formik.values.confirmPassword &&
          !formik.errors.username &&
          !formik.errors.name &&
          !formik.errors.phone &&
          !formik.errors.password &&
          !formik.errors.confirmPassword
      );
    } else if (activeStep === 2) {
      canProceed = Boolean(
        formik.values.district &&
        formik.values.state &&
        !formik.errors.district &&
        !formik.errors.state
      );
    }
    if (canProceed) {
      let fieldsToTouch: string[] = [];
      if (activeStep === 0) {
        fieldsToTouch = ['role'];
      } else if (activeStep === 1) {
        fieldsToTouch = ['name', 'username', 'email', 'phone', 'password', 'confirmPassword'];
      } else if (activeStep === 2) {
        fieldsToTouch = ['district', 'state'];
      }
      fieldsToTouch.forEach(field => formik.setFieldTouched(field, true, true));
      setTimeout(() => {
        setActiveStep((prev) => prev + 1);
      }, 0);
    } else {
      if (activeStep === 1) {
        formik.setTouched({
          username: true,
          name: true,
          email: true,
          phone: true,
          password: true,
          confirmPassword: true,
        });
      } else if (activeStep === 2) {
        formik.setTouched({
          district: true,
          state: true,
        });
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleUsernameSuggest = async () => {
    if (!formik.values.name) {
      notify(t('register.validation.nameRequired'), 'error');
      return;
    }
    setUsernameLoading(true);
    try {
      const { username } = await generateUsernameMutation.mutateAsync(formik.values.name);
      formik.setFieldValue('username', username);
    } catch (err: any) {
      notify(err?.message || t('register.usernameGenError'), 'error');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      await sendEmailOtp(formik.values.email);
      setEmailOtpSent(true);
      notify(t('register.emailOtpSent', 'OTP sent to your email.'), 'success');
    } catch (err: any) {
      setEmailOtpError(err?.message || t('register.emailOtpSendError', 'Failed to send OTP.'));
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailOtpLoading(true);
    setEmailOtpError('');
    try {
      await verifyEmailOtp(formik.values.email, emailOtp);
      setEmailOtpVerified(true);
      notify(t('register.emailOtpVerified', 'Email verified!'), 'success');
    } catch (err: any) {
      setEmailOtpError(err?.message || t('register.emailOtpVerifyError', 'Invalid or expired OTP.'));
      setEmailOtpVerified(false);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  return (
    <ErrorBoundary>
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            {t('register.title')}
          </Typography>
            <RegisterStepper steps={steps} activeStep={activeStep} />
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
            {activeStep === 0 && (
                <AccountTypeStep
                  role={formik.values.role}
                  setRole={(role) => formik.setFieldValue('role', role)}
                  error={formik.errors.role as string}
                  touched={formik.touched.role}
                  roleOptions={roleOptions}
                />
              )}
            {activeStep === 1 && (
                <PersonalDetailsStep
                  values={formik.values}
                  errors={formik.errors}
                  touched={formik.touched}
                  handleChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  handleUsernameSuggest={handleUsernameSuggest}
                  usernameLoading={usernameLoading}
                  usernameAvailable={usernameAvailable}
                  usernameMode={usernameMode}
                  setUsernameMode={setUsernameMode}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                  PasswordStrengthBar={PasswordStrengthBar}
                  // Email OTP props
                  emailOtpSent={emailOtpSent}
                  setEmailOtpSent={setEmailOtpSent}
                  emailOtp={emailOtp}
                  setEmailOtp={setEmailOtp}
                  emailOtpVerified={emailOtpVerified}
                  setEmailOtpVerified={setEmailOtpVerified}
                  emailOtpLoading={emailOtpLoading}
                  emailOtpError={emailOtpError}
                  handleSendEmailOtp={handleSendEmailOtp}
                  handleVerifyEmailOtp={handleVerifyEmailOtp}
                />
              )}
            {activeStep === 2 && (
                <LocationStep
                  values={formik.values}
                  errors={formik.errors}
                  touched={formik.touched}
                  handleChange={formik.handleChange}
                  handleBlur={formik.handleBlur}
                  setFieldValue={formik.setFieldValue}
                  geo={geo}
                  enGeo={enGeo}
                  getEnglishDistrict={getEnglishDistrict}
                  getTranslatedDistrict={getTranslatedDistrict}
                />
              )}
              {/* Remove FinishStep to prevent showing success message before redirect */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
              {activeStep > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ minHeight: 48, fontWeight: 600, borderRadius: 2, flex: 1 }}
                  startIcon={<ArrowBack />}
                  onClick={handleBack}
                >
                  {t('register.back')}
                </Button>
              )}
              <Button
                color="primary"
                variant="contained"
                sx={{ minHeight: 48, fontWeight: 600, borderRadius: 2, flex: 1 }}
                type={activeStep === steps.length - 1 ? 'submit' : 'button'}
                disabled={
                  formik.isSubmitting ||
                  registerButtonClicked ||
                  (
                    (activeStep === 0 && (!formik.values.role || !!formik.errors.role)) ||
                    (activeStep === 1 && (
                      !formik.values.name || !!formik.errors.name ||
                      !formik.values.username || !!formik.errors.username ||
                      !!formik.errors.email ||
                      !formik.values.phone || !!formik.errors.phone ||
                      !formik.values.password || !!formik.errors.password ||
                      !formik.values.confirmPassword || !!formik.errors.confirmPassword ||
                      (usernameMode === 'manual' && usernameAvailable === false) ||
                      (formik.values.email && !emailOtpVerified)
                    )) ||
                    (activeStep === 2 && (
                      !formik.values.district || !!formik.errors.district ||
                      !formik.values.state || !!formik.errors.state
                    )) ||
                    (activeStep === 3 && !(formik.isValid && formik.dirty))
                  )
                }
                onClick={activeStep !== steps.length - 1 ? handleNext : undefined}
              >
                {activeStep === steps.length - 1
                  ? (registerButtonClicked || formik.isSubmitting
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: 8 }}></span>{t('register.registerButton')}</span>
                      : t('register.registerButton'))
                  : t('register.nextButton')}
              </Button>
            </Stack>
          </Box>
          <Box sx={{ mt: 4 }}>
            <Typography variant="body2">
              {t('register.alreadyHaveAnAccount')}{' '}
                <Button component={RouterLink} to="/login">
                {t('register.loginHere')}
                </Button>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
    </ErrorBoundary>
  );
};

export default Register;

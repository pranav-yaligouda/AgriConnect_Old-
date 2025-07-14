import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Stack,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  useTheme,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  Visibility,
  VisibilityOff,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/axiosConfig'; // Centralized axios instance for all API calls
import { toast } from 'react-toastify';

import { useTranslation } from 'react-i18next';
import { stateDistricts } from '../data/stateDistricts';
import enGeo from '../locales/en/geo.json';
import hiGeo from '../locales/hi/geo.json';
import knGeo from '../locales/kn/geo.json';
import mrGeo from '../locales/mr/geo.json';

const roleOptions = [
  { value: 'farmer', label: 'Farmer (Sell your produce)' },
  { value: 'vendor', label: 'Vendor (Buy in bulk for business)' },
  { value: 'user', label: 'Consumer (Buy for personal use)' },
];

const steps = ['Account Type', 'Personal Details', 'Location', 'Finish'];

const geoMap: any = {
  en: enGeo,
  hi: hiGeo,
  kn: knGeo,
  mr: mrGeo,
};

// Password strength bar component
function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Za-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strength = getStrength(password);
  const colors = ['#eee', '#f44336', '#ff9800', '#ffeb3b', '#4caf50'];
  const labels = ['','Weak','Fair','Good','Strong'];
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mt: 1 }}>
      <Box component="span" sx={{ width: 80, height: 8, bgcolor: colors[strength], borderRadius: 2, mr: 1, display: 'inline-block' }} />
      <Typography component="span" variant="caption" color={strength < 2 ? 'error' : strength < 4 ? 'warning.main' : 'success.main'}>
        {labels[strength]}
      </Typography>
    </Box>
  );
}

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Restrict direct access to register page
// Accept both fromLogin and from OTP
useEffect(() => {
  const token = localStorage.getItem('token');
  const state = location.state;
  const isFromLogin = state && state.fromLogin === true;
  const isFromOTP = state && !!state.phone;
  if (!isFromLogin && !isFromOTP) {
    if (token) {
      navigate('/profile', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }
}, [navigate, location.state]);

  const [activeStep, setActiveStep] = useState(0);
  const [phoneFromOTP, setPhoneFromOTP] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (location.state && location.state.phone) {
      setPhoneFromOTP(location.state.phone);
      formik.setFieldValue('phone', location.state.phone);
    }
    // eslint-disable-next-line
  }, [location.state]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const geo = geoMap[i18n.language] || enGeo;

  const formik = useFormik({
    validateOnMount: true,
    initialValues: {
      role: 'user',
      username: '', // Username is required by backend
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
      email: Yup.string()
        .email(t('register.validation.invalidEmail')),
      phone: Yup.string()
        .matches(/^\+?\d{10,15}$/, t('register.validation.phoneInvalid'))
        .required(t('register.validation.phoneRequired')),
      password: Yup.string()
        .min(7, t('register.validation.passwordMinLength', 'Password must be at least 7 characters'))
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/, t('register.validation.passwordPattern', 'Password must contain at least one uppercase letter, one lowercase letter, and one digit. Symbols are allowed.'))
        .required(t('register.validation.passwordRequired')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('register.validation.passwordsMustMatch'))
        .required(t('register.validation.confirmPasswordRequired')),
      street: Yup.string(),
      district: Yup.string().required(t('register.validation.districtRequired')),
      state: Yup.string().required(t('register.validation.stateRequired')),
      zipcode: Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      console.log('Register form submitted', values);
      try {
        // Auto-generate username if not provided
        let username = values.username;
        if (!username || username.trim() === "") {
          // Call backend to generate username from name
          const { generateUsername, registerUser } = await import('../services/apiService');
          const resp = await generateUsername(values.name);
          // Explicitly assert the type to avoid 'unknown' error
          username = (resp as { username: string }).username;
        }
        // Define a type-safe address object
        interface RegisterAddress {
          district: string;
          state: string;
          street?: string;
          zipcode?: string;
        }
        interface RegisterResponse {
          token: string;
          [key: string]: any;
        }
        const address: RegisterAddress = {
          district: values.district,
          state: values.state,
        };
        if (values.street && values.street.trim() !== "") {
          address.street = values.street;
        }
        if (values.zipcode && values.zipcode.trim() !== "") {
          address.zipcode = values.zipcode;
        }
        const reqBody: any = {
          username: username,
          name: values.name,
          password: values.password,
          role: values.role,
          phone: values.phone,
          address,
        };
        if (values.email) reqBody.email = values.email;
        // Debug: Log the registration body
        console.log('Register API body:', reqBody);
        // Dynamically import apiService if not statically imported in this scope
        const { registerUser } = await import('../services/apiService');
        // Use centralized api instance for registration
        let response;
        try {
          response = await api.post<RegisterResponse>(`/users/register`, reqBody);
        } catch (apiError: any) {
          // Show backend error details if available
          if (apiError?.response?.data) {
            toast.error(apiError.response.data.message || 'Registration failed');
            if (apiError.response.data.details) {
              Object.values(apiError.response.data.details).forEach((msg: any) => toast.error(String(msg)));
            }
          } else {
            toast.error(apiError.message || 'Registration failed');
          }
          setSubmitting(false);
          return;
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.data.token);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        toast.success(t('register.success'));
        // Ensure navigation only after token is set and registration is successful
        setTimeout(() => {
          navigate('/profile');
        }, 100);
      } catch (error: any) {
        let message = error?.message || t('register.error');
        const errorDetails = error?.details;
        if (errorDetails) {
          Object.keys(errorDetails).forEach(field => {
            if (field === 'username' && errorDetails[field].code === 'USERNAME_EXISTS') {
              formik.setFieldError('username', 'USERNAME_EXISTS');
            } else {
              formik.setFieldError(field, errorDetails[field].message);
            }
          });
        } else {
          toast.error(message);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/profile');
    }
  }, [navigate]);

  // Auto-generate username when name changes
  useEffect(() => {
    const generateUsername = async () => {
      const name = formik.values.name;
      if (!name || name.length < 2) return;
      // Local username generation (mirrors backend logic):
      let base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
      base = base.replace(/_+/g, '_'); // collapse multiple underscores
      base = base.replace(/^_+|_+$/g, ''); // trim underscores
      if (!base) base = 'user';
      let username = base;
      // Optionally, you can still call the backend for uniqueness if needed

      // if (response.data && response.data.username) {
      //   username = response.data.username;
      // }
      formik.setFieldValue('username', username);
    };
    generateUsername();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.name]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam && roleOptions.find(option => option.value === roleParam)) {
      formik.setFieldValue('role', roleParam);
    }
  }, [location.search]);

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
        ); // email is NOT required
    } else if (activeStep === 2) {
      canProceed = Boolean(
        formik.values.district &&
        formik.values.state &&
        !formik.errors.district &&
        !formik.errors.state
      );
    }

    if (canProceed) {
      // Mark all current step fields as touched before proceeding
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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  useEffect(() => {
    const selectedState = formik.values.state;
    if (selectedState && stateDistricts[selectedState]) {
      // No need to set availableDistricts in state, just reset district if not valid
      if (!stateDistricts[selectedState].includes(formik.values.district)) {
        formik.setFieldValue('district', '');
      }
    } else {
      formik.setFieldValue('district', '');
    }
  }, [formik.values.state]);

  // Helper to get English key from translated district
  const getEnglishDistrict = (stateKey: keyof typeof enGeo.districts, translatedDistrict: string) => {
    const enDistricts = enGeo.districts[stateKey] || [];
    const currentDistricts = geo.districts[stateKey] || [];
    const idx = currentDistricts.indexOf(translatedDistrict);
    return idx !== -1 ? enDistricts[idx] : translatedDistrict;
  };

  // Add this helper to get the translated district from the English key
  const getTranslatedDistrict = (stateKey: keyof typeof geo.districts, englishDistrict: string) => {
    const enDistricts = (enGeo.districts as Record<string, string[]>)[stateKey as string] || [];
    const currentDistricts = (geo.districts as Record<string, string[]>)[stateKey as string] || [];
    const idx = enDistricts.indexOf(englishDistrict);
    return idx !== -1 ? currentDistricts[idx] : englishDistrict;
  };

  // For availableDistricts, use English keys for value, translated for label
  const availableDistricts = formik.values.state && (enGeo.districts as Record<string, string[]>)[formik.values.state] ? (enGeo.districts as Record<string, string[]>)[formik.values.state] : [];

  // In the JSX, before the return, compute the translated selected district:
  const selectedDistrictTranslated =
    formik.values.state && formik.values.district
      ? getTranslatedDistrict(formik.values.state as keyof typeof geo.districts, formik.values.district)
      : '';

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            {t('register.title')}
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('register.accountType')}
                </Typography>
                <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                  <RadioGroup
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                  >
                    {roleOptions.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={<Typography variant="body1">{option.label}</Typography>}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: 1,
                          borderColor: formik.values.role === option.value ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          width: '100%',
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            {activeStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    label={t('register.username')}
                    value={formik.values.username}
                    onChange={async (e) => {
                      formik.handleChange(e);
                      // Suggest username if field is empty and name is filled
                      if (e.target.value === '' && formik.values.name) {
                        setUsernameLoading(true);
                        try {
                          const resp = await api.post<{ username: string }>('/users/generate-username', { name: formik.values.name });
                          formik.setFieldValue('username', resp.data.username);
                        } catch (err) {}
                        setUsernameLoading(false);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.username && Boolean(formik.errors.username)}
                    helperText={
                      (formik.touched.username && formik.errors.username)
                        ? formik.errors.username
                        : usernameLoading
                          ? t('register.usernameLoading')
                          : t('register.usernameHelper')
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            onClick={async () => {
                              setUsernameLoading(true);
                              try {
                                // Use centralized api instance instead of axios
                                const resp = await api.post<{ username: string }>('/users/generate-username', { name: formik.values.name });
                                formik.setFieldValue('username', resp.data.username);
                              } catch (err) {}
                              setUsernameLoading(false);
                            }}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          >
                            {t('register.suggestUsername')}
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    label={t('register.name')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label={`${t('register.email')} (${t('register.optional', 'optional')})`}
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={
                      formik.touched.email && formik.errors.email
                        ? formik.errors.email
                        : t('register.emailOptionalHelper', 'Email is optional. You can leave this blank if you prefer to register with just your phone number.')
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="phone"
                    name="phone"
                    label={t('register.phone')}
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                      readOnly: !!phoneFromOTP
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label={t('register.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={
                      (formik.touched.password && formik.errors.password) ? formik.errors.password : (
                        <span>
                          {t('register.passwordHelper')}<br/>
                          <Box component="span" sx={{ display: 'inline-block' }}>
                            <PasswordStrengthBar password={formik.values.password} />
                          </Box>
                        </span>
                      )
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t('register.confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="street"
                    name="street"
                    label={t('register.talukVillage', 'Taluk/Village')}
                    value={formik.values.street}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.street && Boolean(formik.errors.street)}
                    helperText={formik.touched.street && formik.errors.street}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth required>
                    <InputLabel id="register-state-select-label">{t('register.state')}</InputLabel>
                    <Select
                      labelId="register-state-select-label"
                      id="register-state-select"
                      name="state"
                      value={formik.values.state}
                      label={t('register.state')}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.state && Boolean(formik.errors.state)}
                    >
                      {Object.keys(enGeo.states).map((state) => (
                        <MenuItem key={state} value={state}>{geo.states[state]}</MenuItem>
                      ))}
                    </Select>
                    {formik.touched.state && formik.errors.state && (
                      <Typography variant="caption" color="error">{formik.errors.state}</Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="register-district-select-label">{t('register.district')}</InputLabel>
                    <Select
                      labelId="register-district-select-label"
                      id="register-district-select"
                      name="district"
                      value={selectedDistrictTranslated}
                      label={t('register.district')}
                      onChange={(e) => {
                        // Always store the English key in formik
                        const selectedTranslated = e.target.value;
                        const englishDistrict = getEnglishDistrict(formik.values.state as keyof typeof enGeo.districts, selectedTranslated);
                        formik.setFieldValue('district', englishDistrict);
                      }}
                      onBlur={formik.handleBlur}
                      error={formik.touched.district && Boolean(formik.errors.district)}
                      disabled={!formik.values.state}
                    >
                      {(geo.districts[formik.values.state as keyof typeof geo.districts] || []).map((district: string) => (
                        <MenuItem key={district} value={district}>{district}</MenuItem>
                      ))}
                    </Select>
                    {formik.touched.district && formik.errors.district && (
                      <Typography variant="caption" color="error">{formik.errors.district}</Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    id="zipcode"
                    name="zipcode"
                    label={t('register.zipcode')}
                    value={formik.values.zipcode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.zipcode && Boolean(formik.errors.zipcode)}
                    helperText={formik.touched.zipcode && formik.errors.zipcode}
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 3 && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {t('register.readyToCreateAccount')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('register.clickRegisterToCompleteRegistration')}
                </Typography>
              </Box>
            )}

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
                  (
                    (activeStep === 0 && (!formik.values.role || !!formik.errors.role)) ||
                    (activeStep === 1 && (
                      !formik.values.name || !!formik.errors.name ||
                      !formik.values.username || !!formik.errors.username ||
                      !!formik.errors.email ||
                      !formik.values.phone || !!formik.errors.phone ||
                      !formik.values.password || !!formik.errors.password ||
                      !formik.values.confirmPassword || !!formik.errors.confirmPassword
                    )) ||
                    (activeStep === 2 && (
                      !formik.values.district || !!formik.errors.district ||
                      !formik.values.state || !!formik.errors.state
                    )) ||
                    (activeStep === 3 && !(formik.isValid && formik.dirty))
                  )
                }
                onClick={() => {
                  if (activeStep !== steps.length - 1) {
                    handleNext();
                  }
                }}
              >
                {activeStep === steps.length - 1 ? t('register.registerButton') : t('register.nextButton')}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2">
              {t('register.alreadyHaveAnAccount')}{' '}
              <Link component={RouterLink} to="/login">
                {t('register.loginHere')}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;

import { Grid, TextField, InputAdornment, Button, IconButton, Box, Switch, FormControlLabel, Tooltip } from '@mui/material';
import { Person, Email, Lock, Visibility, VisibilityOff, Autorenew, Phone } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
import React from 'react';

interface PersonalDetailsStepProps {
  values: any;
  errors: any;
  touched: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleBlur: (e: React.FocusEvent<any>) => void;
  handleUsernameSuggest: () => void;
  usernameLoading: boolean;
  usernameAvailable: boolean | null;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  PasswordStrengthBar: React.FC<{ password: string }>;
  usernameMode: 'auto' | 'manual';
  setUsernameMode: (mode: 'auto' | 'manual') => void;
  // Email OTP props
  emailOtpSent: boolean;
  setEmailOtpSent: (v: boolean) => void;
  emailOtp: string;
  setEmailOtp: (v: string) => void;
  emailOtpVerified: boolean;
  setEmailOtpVerified: (v: boolean) => void;
  emailOtpLoading: boolean;
  emailOtpError: string;
  handleSendEmailOtp: () => void;
  handleVerifyEmailOtp: () => void;
}

const PersonalDetailsStep = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  usernameLoading,
  usernameAvailable,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  PasswordStrengthBar,
  usernameMode,
  setUsernameMode,
  emailOtpSent,
  setEmailOtpSent,
  emailOtp,
  setEmailOtp,
  emailOtpVerified,
  setEmailOtpVerified,
  emailOtpLoading,
  emailOtpError,
  handleSendEmailOtp,
  handleVerifyEmailOtp,
}: PersonalDetailsStepProps) => {
  const { t } = useTranslation();
  useNotification(); // for future error display

  let usernameHelper = '';
  if (touched.username && errors.username) {
    usernameHelper = errors.username;
  } else if (usernameLoading) {
    usernameHelper = t('register.usernameLoading');
  } else if (usernameAvailable === true) {
    usernameHelper = t('register.usernameAvailable', 'Username available.');
  } else if (usernameAvailable === false) {
    usernameHelper = t('register.usernameExists', 'Username already exists.');
  } else if (usernameMode === 'auto') {
    usernameHelper = t('register.autoOrManual', 'Username is generated automatically or you can choose your own unique username.');
  } else {
    usernameHelper = t('register.chooseOrAuto', 'Choose a username. You can generate automatically.');
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={usernameMode === 'manual'}
                onChange={(_, checked) => setUsernameMode(checked ? 'manual' : 'auto')}
                color="primary"
              />
            }
            label={usernameMode === 'manual' ? t('register.manualUsername', 'Manual Username') : t('register.autoUsername', 'Automatic Username')}
            sx={{ mr: 2 }}
          />
        </Box>
        <TextField
          fullWidth
          id="username"
          name="username"
          label={t('register.username')}
          value={values.username}
          onChange={e => {
            if (usernameMode === 'manual') {
              // Use setFieldValue directly for robust Formik updates
              // Always lowercase
              handleChange(e); // still call handleChange for touched, validation, etc.
              if (e.target.value !== e.target.value.toLowerCase()) {
                // Only update if needed to avoid double renders
                setTimeout(() => {
                  // Use setTimeout to avoid React event pooling issues
                  values.username !== e.target.value.toLowerCase() &&
                    values.username &&
                    values.username !== '' &&
                    handleChange({
                      ...e,
                      target: {
                        ...e.target,
                        value: e.target.value.toLowerCase(),
                      },
                    });
                }, 0);
              }
            } else {
              handleChange(e);
            }
          }}
          onBlur={handleBlur}
          error={touched.username && Boolean(errors.username) || usernameAvailable === false}
          helperText={usernameHelper}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            )
          }}
          disabled={usernameMode === 'auto'}
          inputProps={{ 'aria-label': t('register.username') }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label={t('register.name')}
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && Boolean(errors.name)}
          helperText={touched.name && errors.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      {values.phone && (
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="phone"
            name="phone"
            label={t('register.phone', 'Phone Number (verified)')}
            value={values.phone}
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <span role="img" aria-label="verified">✅</span>
                </InputAdornment>
              )
            }}
            sx={{ mt: 2 }}
            inputProps={{ 'aria-label': t('register.phone', 'Phone Number (verified)'), readOnly: true }}
          />
        </Grid>
      )}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          id="email"
          name="email"
          label={`${t('register.email')} (${t('register.optional', 'optional')})`}
          value={values.email}
          onChange={e => {
            handleChange(e);
            setEmailOtpSent(false);
            setEmailOtpVerified(false);
            setEmailOtp('');
          }}
          onBlur={handleBlur}
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email ? errors.email : ''}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email />
              </InputAdornment>
            ),
            endAdornment: (
              values.email && !emailOtpVerified && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleSendEmailOtp}
                    disabled={emailOtpLoading || emailOtpSent}
                  >
                    {emailOtpSent ? t('register.otpSent', 'OTP Sent') : t('register.sendOtp', 'Send OTP')}
                  </Button>
                </InputAdornment>
              )
            )
          }}
        />
        {values.email && emailOtpSent && !emailOtpVerified && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              label={t('register.enterOtp', 'Enter OTP')}
              value={emailOtp}
              onChange={e => setEmailOtp(e.target.value)}
              sx={{ mr: 1 }}
              disabled={emailOtpLoading}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleVerifyEmailOtp}
              disabled={emailOtpLoading || !emailOtp}
            >
              {t('register.verify', 'Verify')}
            </Button>
            {emailOtpLoading && <span style={{ marginLeft: 8 }}>{t('register.loading', 'Loading...')}</span>}
            {emailOtpVerified && <span style={{ color: 'green', marginLeft: 8 }}>{t('register.verified', 'Verified!')}</span>}
            {emailOtpError && <span style={{ color: 'red', marginLeft: 8 }}>{emailOtpError}</span>}
          </Box>
        )}
        {values.email && emailOtpVerified && (
          <Box sx={{ mt: 1, color: 'green' }}>{t('register.verified', 'Email verified!')}</Box>
        )}
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          id="password"
          name="password"
          label={t('register.password')}
          type={showPassword ? 'text' : 'password'}
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password && Boolean(errors.password)}
          helperText={
            (touched.password && errors.password) ? errors.password : (
              <span>
                {t('register.passwordHelper')}<br/>
                <Box component="span" sx={{ display: 'inline-block' }}>
                  <PasswordStrengthBar password={values.password} />
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
                  onClick={() => setShowPassword(!showPassword)}
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
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword && Boolean(errors.confirmPassword)}
          helperText={touched.confirmPassword && errors.confirmPassword}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
  );
};

export default PersonalDetailsStep; 
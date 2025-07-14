import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';

// Extend window to hold our recaptcha and confirmation result
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface PhoneAuthProps {
  phoneNumber: string;                  // international format: +91XXXXXXXXXX
  onVerify?: (phone: string) => void;   // callback when OTP verified
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ phoneNumber, onVerify }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isOTPReceived, setIsOTPReceived] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Send OTP using Firebase and invisible reCAPTCHA
   */
  const handleSendOTP = async () => {
    setLoading(true);
    setError('');

    // Initialize invisible reCAPTCHA right before sending OTP
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',                     // no visible widget
          callback: () => {},                    // recaptcha solved callback
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        }
      );

      // Render the widget (needed for some browsers)
      await window.recaptchaVerifier.render();
    } catch (e: any) {
      setError('Failed to initialize reCAPTCHA. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      // Format and validate phone
      let formatted = phoneNumber.replace(/\s+/g, '');
      if (!formatted.startsWith('+')) {
        // Assume Indian country code if missing
        formatted = '+91' + formatted.replace(/^0+/, '');
      }
      if (!/^\+\d{10,15}$/.test(formatted)) {
        setError('Invalid phone format. Use +919876543210');
        setLoading(false);
        return;
      }

      // Send OTP via Firebase
      const result = await signInWithPhoneNumber(auth, formatted, window.recaptchaVerifier);
      window.confirmationResult = result;
      setIsOTPReceived(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify the OTP entered by user
   */
  const handleVerifyOTP = async () => {
    if (otpVerified) return;
    setLoading(true);
    setError('');

    try {
      const result = window.confirmationResult!;
      await result.confirm(verificationCode);
      setOtpVerified(true);

      // Notify parent if provided
      if (onVerify) onVerify(phoneNumber);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  // After successful verification
  if (otpVerified) {
    return (
      <Box mt={2} textAlign="center">
        <Typography variant="h6" color="success.main">
          OTP Verified!
        </Typography>
      </Box>
    );
  }

  return (
    <Box mt={2}>
      {/* Container for invisible reCAPTCHA */}
      <div id="recaptcha-container" />

      {/* Show send or verify UI based on OTP state */}
      {!isOTPReceived ? (
        <>
          {error && <Typography color="error" mb={2}>{error}</Typography>}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSendOTP}
            disabled={loading}
          >
            {loading ? <><CircularProgress size={20} /> Sending OTP</> : 'Send OTP'}
          </Button>
        </>
      ) : (
        <>
          <Typography variant="subtitle1" mb={2}>
            Enter verification code
          </Typography>
          <TextField
            fullWidth
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            placeholder="Enter verification code"
            error={!!error}
            helperText={error}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleVerifyOTP}
            disabled={loading || !verificationCode}
            sx={{ mt: 2 }}
          >
            {loading ? <><CircularProgress size={20} /> Verifying</> : 'Verify OTP'}
          </Button>
        </>
      )}
    </Box>
  );
};

export default PhoneAuth;

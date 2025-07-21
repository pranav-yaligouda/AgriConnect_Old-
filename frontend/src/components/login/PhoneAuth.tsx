import React, { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  TextField,
  Paper,
  Fade,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';

// Extend window to hold our recaptcha and confirmation result
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface PhoneAuthProps {
  phoneNumber: string;                  // international format: +91XXXXXXXXXX
  onVerify?: (phone: string, idToken: string) => void;   // callback when OTP verified
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ phoneNumber, onVerify }) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOTPReceived, setIsOTPReceived] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus next input and handle backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        const activeIndex = inputRefs.current.findIndex(ref => ref === document.activeElement);
        if (activeIndex > 0 && otp[activeIndex] === '') {
          inputRefs.current[activeIndex - 1]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [otp]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleInputFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  /**
   * Send OTP using Firebase and invisible reCAPTCHA
   */
  const handleSendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setError(t('login.recaptchaExpired'));
          }
        }
      );

      await window.recaptchaVerifier.render();
    } catch (e: any) {
      setError(t('login.recaptchaError'));
      setLoading(false);
      return;
    }

    try {
      let formatted = phoneNumber.replace(/\s+/g, '');
      if (!formatted.startsWith('+')) {
        formatted = '+91' + formatted.replace(/^0+/, '');
      }
      if (!/^\+\d{10,15}$/.test(formatted)) {
        setError(t('login.invalidPhoneFormat'));
        setLoading(false);
        return;
      }

      const result = await signInWithPhoneNumber(auth, formatted, window.recaptchaVerifier);
      window.confirmationResult = result;
      setIsOTPReceived(true);
      setResendTimer(30); // 30 seconds cooldown
      setOtp(['', '', '', '', '', '']); // Reset OTP
      inputRefs.current[0]?.focus(); // Focus first input
    } catch (err: any) {
      setError(err.message || t('login.otpSendError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify the OTP entered by user
   */
  const handleVerifyOTP = async (otpCode?: string) => {
    if (otpVerified) return;
    
    const code = otpCode || otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const result = window.confirmationResult!;
      await result.confirm(code);
      setOtpVerified(true);

      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      if (onVerify) onVerify(phoneNumber, idToken);
    } catch (err: any) {
      setError(t('login.invalidOTP'));
      setOtp(['', '', '', '', '', '']); // Reset OTP on error
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    handleSendOTP();
  };

  // After successful verification
  if (otpVerified) {
    return (
      <Fade in={true} timeout={500}>
        <Box mt={3} textAlign="center">
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('login.otpVerified')}
          </Alert>
        </Box>
      </Fade>
    );
  }

  return (
    <Box mt={3}>
      {/* Container for invisible reCAPTCHA */}
      <div id="recaptcha-container" />

      {/* Show send or verify UI based on OTP state */}
      {!isOTPReceived ? (
        <Fade in={true} timeout={300}>
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendOTP}
              disabled={loading}
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: 2
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {t('login.sendingOTP')}
                </>
              ) : (
                t('login.sendOTP')
              )}
            </Button>
          </Box>
        </Fade>
      ) : (
        <Fade in={true} timeout={300}>
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="h6" textAlign="center" mb={1}>
              {t('login.enterOTP')}
            </Typography>
            
            <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
              {t('login.otpSentTo')} {phoneNumber}
            </Typography>

            {/* OTP Input Boxes */}
            <Box 
              display="flex" 
              gap={1} 
              justifyContent="center" 
              mb={3}
              sx={{
                '& .MuiTextField-root': {
                  width: { xs: '45px', sm: '50px' },
                  height: { xs: '45px', sm: '50px' }
                }
              }}
            >
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={el => inputRefs.current[index] = el}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onFocus={() => handleInputFocus(index)}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      padding: 0
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      height: { xs: '45px', sm: '50px' },
                      '& fieldset': {
                        borderColor: digit ? 'primary.main' : 'grey.300'
                      },
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
              ))}
            </Box>

            {/* Verify Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleVerifyOTP()}
              disabled={loading || otp.join('').length !== 6}
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: 2,
                mb: 2
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {t('login.verifyingOTP')}
                </>
              ) : (
                t('login.verifyOTP')
              )}
            </Button>

            {/* Resend OTP */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={1}>
                {t('login.didntReceiveOTP')}
              </Typography>
              <Button
                variant="text"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                sx={{ textTransform: 'none' }}
              >
                {resendTimer > 0 
                  ? `${t('login.resendIn')} ${resendTimer}s`
                  : t('login.resendOTP')
                }
              </Button>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default PhoneAuth;

import { Box, Typography } from '@mui/material';

const PasswordStrengthBar = ({ password }: { password: string }) => {
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
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mt: 1 }}>
      <Box component="span" sx={{ width: 80, height: 8, bgcolor: colors[strength], borderRadius: 2, mr: 1, display: 'inline-block' }} />
      <Typography component="span" variant="caption" color={strength < 2 ? 'error' : strength < 4 ? 'warning.main' : 'success.main'}>
        {labels[strength]}
      </Typography>
    </Box>
  );
};

export default PasswordStrengthBar; 
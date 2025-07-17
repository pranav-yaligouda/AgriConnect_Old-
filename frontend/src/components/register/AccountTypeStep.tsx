import { Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AccountTypeStepProps {
  role: string;
  setRole: (role: string) => void;
  error?: string;
  touched?: boolean;
  roleOptions: { value: string; label: string }[];
}

const AccountTypeStep = ({ role, setRole, error, touched, roleOptions }: AccountTypeStepProps) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('register.accountType')}
      </Typography>
      <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }} error={!!error && touched}>
        <RadioGroup
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
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
                borderColor: role === option.value ? 'primary.main' : 'divider',
                borderRadius: 1,
                width: '100%',
              }}
            />
          ))}
        </RadioGroup>
        {error && touched && (
          <Typography variant="caption" color="error">{error}</Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default AccountTypeStep; 
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const FinishStep = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        {t('register.readyToCreateAccount')}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {t('register.clickRegisterToCompleteRegistration')}
      </Typography>
    </Box>
  );
};

export default FinishStep; 
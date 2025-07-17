import { Stepper, Step, StepLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface RegisterStepperProps {
  steps: string[];
  activeStep: number;
}

const RegisterStepper = ({ steps, activeStep }: RegisterStepperProps) => {
  const { t } = useTranslation();
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', mb: 4 }}>
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel>{t(label)}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default RegisterStepper; 
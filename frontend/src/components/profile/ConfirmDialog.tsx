import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  role: 'user' | 'farmer';
  quantity: number;
  setQuantity: (q: number) => void;
  price: string;
  setPrice: (p: string) => void;
  feedback: string;
  setFeedback: (f: string) => void;
  didBuyOrSell: boolean;
  setDidBuyOrSell: (b: boolean) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onSubmit, loading, role,
  quantity, setQuantity, price, setPrice, feedback, setFeedback, didBuyOrSell, setDidBuyOrSell
}) => {
  const { t } = useTranslation('profile');
  const isPriceInvalid = price === '' || isNaN(Number(price)) || Number(price) <= 0;
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{role === 'user' ? t('confirmPurchase') : t('confirmSale')}</DialogTitle>
      <DialogContent>
        <TextField
          label={role === 'user' ? t('finalBoughtQuantity') : t('finalSoldQuantity')}
          type="number"
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          fullWidth
          sx={{ mt: 2 }}
        />
        <TextField
          label={t('finalPrice')}
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
          required
          error={isPriceInvalid}
          helperText={price === '' ? t('finalPriceRequired') : (isPriceInvalid ? t('enterValidPrice') : '')}
        />
        <TextField
          label={t('feedbackOptional')}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
        <Box sx={{ mt: 2 }}>
          <Button
            variant={didBuyOrSell ? 'contained' : 'outlined'}
            color="success"
            onClick={() => setDidBuyOrSell(true)}
            sx={{ mr: 1 }}
          >
            {role === 'user' ? t('yesIBought') : t('yesISold')}
          </Button>
          <Button
            variant={!didBuyOrSell ? 'contained' : 'outlined'}
            color="error"
            onClick={() => setDidBuyOrSell(false)}
          >
            {role === 'user' ? t('noIDidNotBuy') : t('noIDidNotSell')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={onSubmit} color="primary" disabled={isPriceInvalid || loading}>
          {t('submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 
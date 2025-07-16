import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DeleteProductDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({ open, onClose, onConfirm, loading }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('dashboard.deleteProduct')}</DialogTitle>
      <DialogContent>
        <Typography>{t('dashboard.deleteProductConfirm')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dashboard.cancel')}</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : t('dashboard.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteProductDialog; 
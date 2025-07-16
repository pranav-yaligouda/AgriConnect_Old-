import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { deleteProfile } from '../../services/apiService';
import type { AccountDeleteResponse, ApiErrorResponse } from '../../types/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deleteProfileMutation = useMutation<AccountDeleteResponse, ApiErrorResponse, void>({
    mutationFn: deleteProfile,
    onSuccess: () => {
      navigate('/login');
    },
  });

  const handleDelete = () => {
    deleteProfileMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('profile.deleteAccount')}</DialogTitle>
      <DialogContent>
        <Typography>
          {t('profile.deleteAccountMessage')} {t('profile.deleteAccountDescription')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('profile.cancel')}</Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={deleteProfileMutation.status === 'pending'}
        >
          {deleteProfileMutation.status === 'pending' ? <CircularProgress size={20} /> : t('profile.deleteAccount')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountDialog; 
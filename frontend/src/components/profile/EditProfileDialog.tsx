import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Avatar, Grid, TextField, CircularProgress
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import type { User, ApiErrorResponse, ProfileFetchResponse } from '../../types/api';
import { uploadProfileImageFile, updateProfile } from '../../services/apiService';
import { useMutation } from '@tanstack/react-query';
import { getRoleProfilePlaceholder } from './utils';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
import { isValidImageFile } from '../../utils/validateImageFile';
import { readAndCompressImage } from 'browser-image-resizer';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  refreshUser: () => Promise<void>;
}

interface EditForm {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    district: string;
    state: string;
    zipcode: string;
  };
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ open, onClose, user, refreshUser }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    email: '',
    phone: '',
    address: { street: '', district: '', state: '', zipcode: '' },
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeConfig = {
    quality: 0.9,
    maxWidth: 300,
    maxHeight: 300,
    autoRotate: true,
    debug: false,
  };

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          district: user.address?.district || '',
          state: user.address?.state || '',
          zipcode: user.address?.zipcode || '',
        },
      });
      setProfileImagePreview(user.profileImageUrl || null);
      setProfileImageFile(null);
      setProfileImageError(null);
    }
  }, [user, open]);

  const updateProfileMutation = useMutation<ProfileFetchResponse, ApiErrorResponse, Partial<User>>({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refreshUser();
      onClose();
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setProfileImageError(null);
      notify(t('profile.profileUpdated'), 'success');
    },
    onError: (error: ApiErrorResponse) => {
      notify(error.message || t('profile.failedToUpdateProfile'), 'error');
    },
    onSettled: () => setUploadingProfileImage(false),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditForm((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EditForm] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const { valid, reason } = await isValidImageFile(file);
    if (!valid) {
      setProfileImageError(reason || 'Invalid image file.');
      notify(reason || 'Invalid image file.', 'error');
      return;
    }
    // Resize before upload
    let resizedFile: File;
    try {
      resizedFile = await readAndCompressImage(file, resizeConfig);
    } catch (err) {
      setProfileImageError('Failed to resize image.');
      notify('Failed to resize image.', 'error');
      return;
    }
    setProfileImageFile(resizedFile);
    setProfileImageError(null);
    setProfileImagePreview(resizedFile ? URL.createObjectURL(resizedFile) : user.profileImageUrl || null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingProfileImage(true);
    try {
      let profileImageUrl = undefined;
      if (profileImageFile) {
        // Already resized in handleProfileImageChange
        const imgRes = await uploadProfileImageFile(profileImageFile);
        profileImageUrl = imgRes.profileImageUrl;
      }
      const payload = { ...editForm };
      if (profileImageUrl) (payload as any).profileImageUrl = profileImageUrl;
      updateProfileMutation.mutate(payload);
    } catch (error: any) {
      notify(error.message || t('profile.failedToUpdateProfile'), 'error');
      setUploadingProfileImage(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile.editProfile')}</DialogTitle>
      <form onSubmit={handleEditSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1, mb: 2 }}>
            <Box sx={{ position: 'relative', mb: 1 }}>
              <Avatar
                src={profileImagePreview || getRoleProfilePlaceholder(user.role)}
                alt={user.name || 'Profile'}
                sx={{ width: 100, height: 100, border: theme => `3px solid #388e3c`, bgcolor: '#f0f0f0' }}
                imgProps={{ loading: 'lazy', style: { objectFit: 'cover' } }}
              />
              <Button
                variant="contained"
                size="small"
                sx={{ position: 'absolute', bottom: 4, right: 4, minWidth: 0, borderRadius: '50%' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Edit fontSize="small" />
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
                tabIndex={-1}
              />
              {uploadingProfileImage && (
                <CircularProgress size={32} sx={{ position: 'absolute', top: 34, left: 34, zIndex: 3 }} />
              )}
              {profileImageError && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>{profileImageError}</Box>
              )}
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.name')}
                name="name"
                value={editForm.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.email')}
                name="email"
                type="email"
                value={editForm.email}
                disabled
                required
                sx={{
                  "& .MuiInputBase-input": {
                    cursor: "not-allowed",
                    color: "text.disabled",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.phone')}
                name="phone"
                value={editForm.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.street')}
                name="address.street"
                value={editForm.address.street}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile.district')}
                name="address.district"
                value={editForm.address.district}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile.state')}
                name="address.state"
                value={editForm.address.state}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.zipCode')}
                name="address.zipcode"
                value={editForm.address.zipcode}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('profile.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={uploadingProfileImage || updateProfileMutation.status === 'pending'}>
            {t('profile.saveChanges')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfileDialog; 
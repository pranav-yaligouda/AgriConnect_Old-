import { Box, Avatar, Typography, Chip, Button } from "@mui/material";
import { Edit, Delete, GrassOutlined, History } from "@mui/icons-material";
import type { User } from '../../types/api';
import { getRoleProfilePlaceholder } from './utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { isValidImageFile } from '../../utils/validateImageFile';

interface ProfileHeaderProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{
      mb: 4,
      borderRadius: 4,
      boxShadow: 6,
      overflow: 'visible',
      position: 'relative',
      background: 'linear-gradient(135deg, #2e7d32 0%, #26a69a 100%)',
    }}>
      {/* Banner with modern organic wave SVG */}
      <Box sx={{
        height: { xs: 110, sm: 180 },
        width: '100%',
        position: 'relative',
        background: 'linear-gradient(90deg, #e0f7fa 0%, #fffde4 100%)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="profileWaveGradient" x1="0" y1="0" x2="1440" y2="180" gradientUnits="userSpaceOnUse">
                <stop stopColor="#388e3c" />
                <stop offset="1" stopColor="#26a69a" />
              </linearGradient>
            </defs>
            <path d="M0,80 C360,180 1080,0 1440,100 L1440,180 L0,180 Z" fill="url(#profileWaveGradient)" />
          </svg>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-end' },
          gap: { xs: 2, sm: 4 },
          px: { xs: 2, sm: 4 },
          pb: { xs: 2, sm: 3 },
          pt: { xs: 0, sm: 0 },
          position: 'relative',
          top: { xs: -56, sm: -90 },
          zIndex: 2,
        }}
      >
        <Avatar
          src={user.profileImageUrl || getRoleProfilePlaceholder(user.role)}
          alt={user.name || 'Profile'}
          sx={{
            width: { xs: 112, sm: 144 },
            height: { xs: 112, sm: 144 },
            border: '5px solid #fff',
            boxShadow: 6,
            bgcolor: '#f0f0f0',
            mt: { xs: -8, sm: -14 },
            zIndex: 3,
            transition: 'box-shadow 0.3s',
            '&:hover': {
              boxShadow: 12,
            },
          }}
          imgProps={{
            loading: 'lazy',
            style: { objectFit: 'cover' },
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0, mt: { xs: 1, sm: 4 } }}>
          <Typography
            variant="h3"
            sx={{
              typography: { xs: 'h5', sm: 'h3' },
              wordBreak: 'break-word',
              textAlign: { xs: 'center', sm: 'left' },
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 2px 8px rgba(44,62,80,0.18)',
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            {user.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Chip icon={<GrassOutlined />} label={t(`profile.${user.role}`)} color="success" size="small" sx={{ fontWeight: 500, bgcolor: '#e8f5e9', color: '#388e3c' }} />
            {user.username && (
              <Chip icon={<Edit />} label={`@${user.username}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
            )}
            <Chip icon={<History />} label={`${t('profile.memberSince')} ${new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`} size="small" sx={{ bgcolor: '#fffde7', color: '#fbc02d' }} />
          </Box>
          <Box
            sx={{
              width: { xs: '100%', sm: 'auto' },
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'row', sm: 'row' },
              justifyContent: { xs: 'center', sm: 'flex-start' },
              mt: { xs: 2, sm: 2 },
            }}
          >
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={onEdit}
              size="medium"
              sx={{
                fontWeight: 600,
                bgcolor: '#388e3c',
                color: '#fff',
                '&:hover': { bgcolor: '#2e7d32' },
                boxShadow: 2,
              }}
            >
              {t('profile.editProfile')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={onDelete}
              size="medium"
              sx={{
                fontWeight: 600,
                bgcolor: '#fff',
                color: '#d32f2f',
                borderColor: '#d32f2f',
                '&:hover': { bgcolor: '#ffebee', borderColor: '#b71c1c' },
                boxShadow: 2,
              }}
            >
              {t('profile.deleteAccount')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileHeader; 
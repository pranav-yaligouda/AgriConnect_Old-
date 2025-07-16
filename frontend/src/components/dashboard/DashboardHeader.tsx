import React from 'react';
import { Box, Avatar, Typography, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SummaryCard from './SummaryCard';
import { getRoleProfilePlaceholder } from './utils';
import type { User, Product } from '../../types/api';

interface DashboardHeaderProps {
  user: User;
  products: Product[];
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, products }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={4}>
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2, boxShadow: 2 }}>
          <Avatar
            src={user?.profileImageUrl || getRoleProfilePlaceholder(user?.role)}
            alt={user?.name || 'Profile'}
            sx={{ width: 56, height: 56, bgcolor: '#fff', color: '#222', fontWeight: 700, fontSize: 28, border: '2px solid #eee' }}
            imgProps={{
              onError: (e: any) => {
                e.currentTarget.src = getRoleProfilePlaceholder(user?.role);
              }
            }}
          >
            {user?.name?.[0] || '?'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
            <Typography variant="body2">{user?.role?.toUpperCase()}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{user?.email}</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <SummaryCard
          icon={<span role="img" aria-label="products">🛒</span>}
          value={products.length}
          label={t('dashboard.productsListed')}
          color={'secondary.main'}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <SummaryCard
          icon={<span role="img" aria-label="orders">📦</span>}
          value={0}
          label={t('dashboard.orders')}
          color={'success.main'}
        />
      </Grid>
    </Grid>
  );
};

export default DashboardHeader; 
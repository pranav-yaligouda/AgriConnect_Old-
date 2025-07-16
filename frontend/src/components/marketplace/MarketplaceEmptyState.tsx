import React from 'react';
import { Paper, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface MarketplaceEmptyStateProps {
  onResetFilters?: () => void;
  error?: boolean;
}

const MarketplaceEmptyState: React.FC<MarketplaceEmptyStateProps> = ({ onResetFilters, error }) => {
  const { t } = useTranslation('marketplace');
  return (
    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom color={error ? 'error' : undefined}>
        {error ? t('fetchError') : t('noProductsFound')}
      </Typography>
      {!error && (
        <>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('tryAdjustingSearch')}
          </Typography>
          {onResetFilters && (
            <Button
              variant="contained"
              sx={{ mt: 2, borderRadius: 2, py: 1, px: 3 }}
              onClick={onResetFilters}
            >
              {t('reset')}
            </Button>
          )}
        </>
      )}
    </Paper>
  );
};

export default MarketplaceEmptyState; 
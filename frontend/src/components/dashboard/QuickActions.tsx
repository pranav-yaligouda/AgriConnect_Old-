import React from 'react';
import { Button, Paper, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';

interface QuickActionsProps {
  role: string;
  onAddProduct: () => void;
  onManageProducts: () => void;
  onBrowseProducts: () => void;
  onBulkOrders: () => void;
  onViewProfile: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ role, onAddProduct, onManageProducts, onBrowseProducts, onBulkOrders, onViewProfile }) => {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>{t('dashboard.quickActions')}</Typography>
      <Stack spacing={2}>
        {role === 'farmer' && (
          <>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onAddProduct} fullWidth>
              {t('dashboard.addNewProduct')}
            </Button>
            <Button variant="outlined" color="primary" startIcon={<InventoryIcon />} onClick={onManageProducts} fullWidth>
              {t('dashboard.manageProducts')}
            </Button>
          </>
        )}
        {role === 'vendor' && (
          <>
            <Button variant="contained" startIcon={<ShoppingCartIcon />} onClick={onBrowseProducts} fullWidth>
              {t('dashboard.browseProducts')}
            </Button>
            <Button variant="outlined" startIcon={<LocalShippingIcon />} onClick={onBulkOrders} fullWidth>
              {t('dashboard.bulkOrders')}
            </Button>
          </>
        )}
        {role === 'user' && (
          <>
            <Button variant="contained" startIcon={<ShoppingCartIcon />} onClick={onBrowseProducts} fullWidth>
              {t('dashboard.browseProducts')}
            </Button>
            <Button variant="outlined" startIcon={<PersonIcon />} onClick={onViewProfile} fullWidth>
              {t('dashboard.viewProfile')}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default QuickActions; 
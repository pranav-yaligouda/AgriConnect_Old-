import React from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Chip, Box, Typography, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { Product } from '../../types/api';

interface ProductTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onRowClick }) => {
  const { t } = useTranslation();
  return (
    <TableContainer sx={{ minWidth: { xs: 400, sm: 600 }, width: '100%' }}>
      <Table size="small">
        <TableHead
          sx={{
            backgroundColor: 'primary.light',
            '& th': {
              color: 'primary.contrastText',
              fontWeight: 'bold',
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 2 },
              fontSize: { xs: '0.9rem', sm: '1rem' },
            },
          }}
        >
          <TableRow>
            <TableCell>{t('dashboard.product')}</TableCell>
            <TableCell>{t('dashboard.category')}</TableCell>
            <TableCell align="right">{t('dashboard.price')}</TableCell>
            <TableCell align="right">{t('dashboard.stock')}</TableCell>
            <TableCell>{t('dashboard.harvestDate')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product._id}
              hover
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
              onClick={() => onRowClick(product)}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <Avatar
                    src={product.images[0] || '/product-placeholder.jpg'}
                    variant="rounded"
                    sx={{ width: { xs: 36, sm: 56 }, height: { xs: 36, sm: 56 }, mr: 1, boxShadow: 2, backgroundColor: 'grey.200' }}
                    imgProps={{
                      onError: (e: any) => {
                        e.currentTarget.src = '/product-placeholder.jpg';
                      }
                    }}
                  >
                    <InventoryIcon fontSize="medium" />
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{product.name}</Typography>
                    {product.isOrganic && (
                      <Chip label={t('dashboard.organic')} size="small" color="success" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip label={product.category} color="primary" variant="filled" sx={{ textTransform: 'capitalize', fontSize: { xs: '0.8rem', sm: '1rem' } }} />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="primary" fontWeight={500}>
                  ₹{product.price}/{product.unit}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  <Box sx={{ width: { xs: 36, sm: 60 }, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((product.availableQuantity / 100) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4, backgroundColor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: product.availableQuantity > 20 ? 'success.main' : 'warning.main' } }}
                    />
                  </Box>
                  <Typography variant="caption">
                    {product.availableQuantity} {product.unit}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={new Date(product.harvestDate).toLocaleDateString()}
                  variant="outlined"
                  color="secondary"
                  icon={<CalendarTodayIcon fontSize="small" sx={{ color: 'inherit' }} />}
                  sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable; 
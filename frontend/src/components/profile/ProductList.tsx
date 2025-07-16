import React from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import type { Product } from '../../types/api';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, loading, onView, onDelete }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!products.length) {
    return <Typography variant="body1" color="text.secondary">{t('profile.noProductsUploaded')}</Typography>;
  }
  return (
    <Grid container spacing={3}>
      {products.map(product => (
        <Grid item xs={12} sm={6} md={4} key={product._id}>
          <ProductCard product={product} onView={onView} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductList; 
import React from 'react';
import { Grid, Card, CardContent, CardActions, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../types/api';

interface ProductGridProps {
  products: Product[];
  onViewDetails: (product: Product) => void;
  onBulkOrder?: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onViewDetails, onBulkOrder }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={2}>
      {products.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={product._id}>
          <Card>
            <CardContent>
              <img
                src={product.images[0] || '/product-placeholder.jpg'}
                alt={product.name}
                style={{ width: '100%', height: 200, objectFit: 'cover' }}
                onError={(e: any) => { e.currentTarget.src = '/product-placeholder.jpg'; }}
              />
              <Typography variant="h6" sx={{ mt: 1 }}>{product.name}</Typography>
              <Typography color="textSecondary">
                ₹{product.price}/{product.unit}
              </Typography>
              <Typography>
                {t('dashboard.available')}: {product.availableQuantity} {product.unit}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => onViewDetails(product)}>
                {t('dashboard.viewDetails')}
              </Button>
              {onBulkOrder && (
                <Button size="small" color="primary" onClick={() => onBulkOrder(product)}>
                  {t('dashboard.bulkOrder')}
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid; 
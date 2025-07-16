import React from 'react';
import { Grid } from '@mui/material';
import type { Product } from '../../types/api';
import MarketplaceProductCard from './MarketplaceProductCard';

interface MarketplaceProductGridProps {
  products: Product[];
  onViewDetails: (id: string) => void;
}

const MarketplaceProductGrid: React.FC<MarketplaceProductGridProps> = ({ products, onViewDetails }) => {
  return (
    <Grid container spacing={2}>
      {products.map(product => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={product._id}>
          <MarketplaceProductCard product={product} onViewDetails={onViewDetails} />
        </Grid>
      ))}
    </Grid>
  );
};

export default MarketplaceProductGrid; 
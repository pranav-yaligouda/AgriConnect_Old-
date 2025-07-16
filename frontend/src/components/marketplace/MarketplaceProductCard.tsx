import React from 'react';
import { Card, CardContent, CardActions, Chip, Box, Typography, Button } from '@mui/material';
import { GrassOutlined, Store, LocationOn } from '@mui/icons-material';
import ImageWithFallback from '../ImageWithFallback';
import { useTranslation } from 'react-i18next';
import type { Product } from '../../types/api';

interface MarketplaceProductCardProps {
  product: Product;
  onViewDetails: (id: string) => void;
}

const MarketplaceProductCard: React.FC<MarketplaceProductCardProps> = ({ product, onViewDetails }) => {
  const { t } = useTranslation('marketplace');
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 500, position: 'relative' }}>
      {/* Badges */}
      <Box sx={{ position: 'absolute', left: 16, top: 16, zIndex: 1, display: 'flex', gap: 1 }}>
        {product.isOrganic && (
          <Chip label={t('organic')} size="small" color="secondary" icon={<GrassOutlined />} sx={{ fontWeight: 'bold', borderRadius: '16px' }} />
        )}
        {new Date(product.harvestDate) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
          <Chip label={t('fresh')} size="small" color="success" sx={{ fontWeight: 'bold', borderRadius: '16px' }} />
        )}
      </Box>
      {/* Product Image */}
      <Box sx={{ position: 'relative', height: '200px', width: '100%' }}>
        <ImageWithFallback
          src={product.images[0] || '/product-placeholder.jpg'}
          fallbackSrc="/product-placeholder.jpg"
          alt={product.name}
          style={{ objectFit: 'cover', height: '100%', width: '100%', borderRadius: 2 }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
        <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
          <Chip label={`₹${product.price}/${product.unit}`} sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', borderRadius: '16px' }} />
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1, px: 2 }}>
        {/* Product title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1.2, height: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </Typography>
        </Box>
        {/* Short description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.description}
        </Typography>
        {/* Farmer info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Store fontSize="small" color="primary" sx={{ mr: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {typeof product.farmer === 'object' && product.farmer?.name ? product.farmer.name : t('unknownFarmer')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {product.location ? `${product.location.district}, ${product.location.state}` : t('locationNotSpecified')}
          </Typography>
        </Box>
        {/* Stock */}
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="body2" color={
            product.availableQuantity > 20 ? 'success.main' :
            product.availableQuantity > 5 ? 'warning.main' : 'error.main'
          }>
            {product.availableQuantity > 20 ? t('inStock') :
              product.availableQuantity > 5 ? t('limitedStock') : t('almostSoldOut')}
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          sx={{ borderRadius: '20px', fontWeight: 'medium', width: '100%' }}
          onClick={() => onViewDetails(product._id)}
          aria-label={t('viewProductDetails')}
        >
          {t('viewProductDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};

export default MarketplaceProductCard; 
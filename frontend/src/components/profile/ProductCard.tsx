import React from 'react';
import { Card, CardContent, CardMedia, Box, Typography, Chip, Button } from '@mui/material';
import { Delete, Inventory } from '@mui/icons-material';
import type { Product } from '../../types/api';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onView, onDelete }) => {
  const { t } = useTranslation();
  return (
    <Card sx={{
      p: 0,
      borderRadius: 4,
      boxShadow: 4,
      transition: 'box-shadow 0.3s, transform 0.2s',
      '&:hover': {
        boxShadow: 8,
        transform: 'translateY(-4px) scale(1.02)',
      },
      display: 'flex',
      flexDirection: 'column',
      minHeight: 340,
    }}>
      {product.images && product.images.length > 0 ? (
        <Box sx={{
          width: '100%',
          pt: '60%', // 5:3 aspect ratio
          position: 'relative',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
        }}>
          <CardMedia
            component="img"
            image={product.images[0]}
            alt={product.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          />
        </Box>
      ) : (
        <Box sx={{
          width: '100%',
          pt: '60%',
          bgcolor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}>
          <Inventory sx={{ fontSize: 48, color: '#bdbdbd' }} />
        </Box>
      )}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2, color: 'text.primary' }}>{product.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label={product.category ?? 'N/A'} size="small" color="info" sx={{ textTransform: 'capitalize' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{t('profile.price')}: <b>{product.price}</b> / {product.unit}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{t('profile.available')}: <b>{product.availableQuantity}</b></Typography>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onView(product._id)}
            sx={{ fontWeight: 500 }}
          >
            {t('profile.viewDetails')}
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<Delete />}
            onClick={() => onDelete(product._id)}
            sx={{ fontWeight: 500 }}
          >
            {t('profile.delete')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard; 
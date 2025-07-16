import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface MarketplaceHeroProps {
  title?: string;
  tagline?: string;
  chips?: string[];
}

const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({ title, tagline, chips }) => {
  const { t } = useTranslation('marketplace');
  const heroTitle = title || t('hero.title');
  const heroTagline = tagline || t('hero.tagline');
  const heroChips = chips || [t('hero.chip1'), t('hero.chip2'), t('hero.chip3')];

  return (
    <Box sx={{ mb: 3, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        {heroTitle}
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
        {heroTagline}
      </Typography>
      <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2, mb: 1 }}>
        {heroChips.map((chip, idx) => (
          <Chip key={chip + idx} label={chip} color="primary" variant="outlined" />
        ))}
      </Stack>
    </Box>
  );
};

export default MarketplaceHero; 
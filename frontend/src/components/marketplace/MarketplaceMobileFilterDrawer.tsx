import React from 'react';
import {
  Box, Typography, IconButton, Divider, FormGroup, FormControlLabel, Checkbox, FormControl, InputLabel, Select, MenuItem, Button, Drawer
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MarketplaceMobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  uniqueDistricts: string[];
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  organicOnly: boolean;
  onOrganicChange: (checked: boolean) => void;
  onClearFilters: () => void;
}

const MarketplaceMobileFilterDrawer: React.FC<MarketplaceMobileFilterDrawerProps> = ({
  open, onClose, categories, selectedCategories, onCategoryChange, uniqueDistricts, selectedDistrict, onDistrictChange, organicOnly, onOrganicChange, onClearFilters
}) => {
  const { t } = useTranslation('marketplace');
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: '85vw',
          maxWidth: 320,
          boxSizing: 'border-box',
          '& .MuiFormControlLabel-root': { alignItems: 'flex-start' },
        },
      }}
    >
      <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {t('filters')}
          </Typography>
          <IconButton onClick={onClose} aria-label={t('closeFilters')}>
            <Close />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}>
          {/* Categories Section */}
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {t('categories')}
          </Typography>
          <FormGroup sx={{ mb: 3 }}>
            {categories.map(category => (
              <FormControlLabel
                key={category}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onChange={() => onCategoryChange(category)}
                    size="small"
                    sx={{ py: 0.5 }}
                  />
                }
                label={<Typography variant="body2" sx={{ fontSize: '0.9rem' }}>{capitalize(category)}</Typography>}
                sx={{ mx: 0, py: 0.5, '&:hover': { backgroundColor: 'action.hover' } }}
              />
            ))}
          </FormGroup>
          <Divider sx={{ my: 2 }} />
          {/* Location Section */}
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {t('location')}
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel sx={{ fontSize: '0.9rem' }}>{t('selectDistrict')}</InputLabel>
            <Select
              value={selectedDistrict}
              onChange={e => onDistrictChange(e.target.value as string)}
              sx={{ fontSize: '0.9rem' }}
            >
              <MenuItem value="">
                <em>{t('allDistricts')}</em>
              </MenuItem>
              {uniqueDistricts.map(district => (
                <MenuItem key={district} value={district}>
                  {capitalize(district)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }} />
          {/* Organic Filter */}
          <FormControlLabel
            control={
              <Checkbox
                checked={organicOnly}
                onChange={e => onOrganicChange(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.9rem' }}>{t('showOnlyOrganic')}</Typography>}
            sx={{ mx: 0 }}
          />
          <Divider sx={{ my: 3 }} />
          {/* Reset Button */}
          <Button
            fullWidth
            variant="outlined"
            size="medium"
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.9rem', py: 1 }}
            onClick={onClearFilters}
          >
            {t('clearAllFilters')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default MarketplaceMobileFilterDrawer; 
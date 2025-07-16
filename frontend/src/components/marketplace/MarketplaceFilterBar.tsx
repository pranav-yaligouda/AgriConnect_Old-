import React from 'react';
import {
  Box, Paper, Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Chip, Stack, Tooltip, FormControlLabel
} from '@mui/material';
import { Search, Sort, Category, LocationOn, GrassOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MarketplaceFilterBarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sortBy: string;
  onSortChange: (e: React.ChangeEvent<{ value: unknown }>) => void;
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  categories: string[];
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  uniqueDistricts: string[];
  organicOnly: boolean;
  onOrganicChange: (checked: boolean) => void;
}

const MarketplaceFilterBar: React.FC<MarketplaceFilterBarProps> = ({
  searchQuery, onSearchChange, sortBy, onSortChange, selectedCategories, onCategoryChange, categories, selectedDistrict, onDistrictChange, uniqueDistricts, organicOnly, onOrganicChange
}) => {
  const { t } = useTranslation('marketplace');
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Box sx={{ display: { xs: 'none', md: 'block' }, width: '100%', mb: 2 }}>
      <Paper sx={{ mb: 2, p: 2, borderRadius: 4, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('searchPlaceholder')}
              variant="outlined"
              size="medium"
              value={searchQuery}
              onChange={onSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'grey.50' },
                },
              }}
              inputProps={{ 'aria-label': t('searchPlaceholder') }}
            />
          </Grid>
          {/* Sort Select */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Sort fontSize="small" /> {t('sortBy')}
                </Stack>
              </InputLabel>
              <Select
                value={sortBy}
                label={t('sortBy')}
                onChange={onSortChange as any}
                sx={{ borderRadius: 3, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.50' } }}
              >
                <MenuItem value="featured">{t('featured')}</MenuItem>
                <MenuItem value="price-asc">{t('priceLowToHigh')}</MenuItem>
                <MenuItem value="price-desc">{t('priceHighToLow')}</MenuItem>
                <MenuItem value="newest">{t('newest')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Categories Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="medium">
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Category fontSize="small" /> {t('category')}
                </Stack>
              </InputLabel>
              <Select
                multiple
                value={selectedCategories}
                onChange={e => {
                  const value = e.target.value as string[];
                  if (value.includes('all')) onCategoryChange('all');
                  else value.forEach(cat => onCategoryChange(cat));
                }}
                label={t('category')}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map(value => (
                      <Chip key={value} label={capitalize(value)} size="small" sx={{ borderRadius: 2 }} />
                    ))}
                  </Box>
                )}
                sx={{ borderRadius: 3, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.50' } }}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    <Checkbox checked={selectedCategories.includes(category)} />
                    <ListItemText primary={capitalize(category)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Location Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <LocationOn fontSize="small" /> {t('district')}
                </Stack>
              </InputLabel>
              <Select
                value={selectedDistrict}
                label={t('district')}
                onChange={e => onDistrictChange(e.target.value as string)}
                sx={{ borderRadius: 3, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.50' } }}
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
          </Grid>
          {/* Organic Filter */}
          <Grid item xs={12} md={1}>
            <Tooltip title={t('showOnlyOrganic')}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={organicOnly}
                    onChange={e => onOrganicChange(e.target.checked)}
                    color="primary"
                    icon={<GrassOutlined />}
                    checkedIcon={<GrassOutlined />}
                  />
                }
                label=""
                sx={{ m: 0, '& .MuiButtonBase-root': { p: 1 }, '&:hover': { bgcolor: 'grey.50', borderRadius: 2 } }}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MarketplaceFilterBar; 
import React from 'react';
import { Stack, Chip } from '@mui/material';
import { GrassOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MarketplaceSelectedFiltersProps {
  selectedCategories: string[];
  onCategoryDelete: (category: string) => void;
  organicOnly: boolean;
  onOrganicDelete: () => void;
  searchQuery: string;
  onSearchDelete: () => void;
  selectedDistrict: string;
  onDistrictDelete: () => void;
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const MarketplaceSelectedFilters: React.FC<MarketplaceSelectedFiltersProps> = ({
  selectedCategories, onCategoryDelete, organicOnly, onOrganicDelete, searchQuery, onSearchDelete, selectedDistrict, onDistrictDelete
}) => {
  const { t } = useTranslation('marketplace');
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
      {selectedCategories.map(category => (
        <Chip
          key={category}
          label={capitalize(category)}
          onDelete={() => onCategoryDelete(category)}
          size="medium"
          color="primary"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        />
      ))}
      {organicOnly && (
        <Chip
          label={t('organic')}
          onDelete={onOrganicDelete}
          size="medium"
          color="secondary"
          icon={<GrassOutlined />}
          sx={{ borderRadius: 2 }}
        />
      )}
      {searchQuery && (
        <Chip
          label={`"${searchQuery}"`}
          onDelete={onSearchDelete}
          size="medium"
          color="default"
          sx={{ borderRadius: 2 }}
        />
      )}
      {selectedDistrict && (
        <Chip
          label={`${t('district')}: ${capitalize(selectedDistrict)}`}
          onDelete={onDistrictDelete}
          size="medium"
          color="default"
          sx={{ borderRadius: 2 }}
        />
      )}
    </Stack>
  );
};

export default MarketplaceSelectedFilters; 
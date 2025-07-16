import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, FormControlLabel, Switch, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Autocomplete from '@mui/material/Autocomplete';
import ImageUpload from './ImageUpload';
import type { Product, ProductNameOption } from '../../types/api';
import { isValidImageFile } from '../../utils/validateImageFile';

type NewProductForm = {
  name: string;
  description: string;
  price: string;
  category: '' | Product['category'];
  availableQuantity: string;
  minimumOrderQuantity?: string;
  unit: '' | Product['unit'];
  images: string[];
  harvestDate: string;
  isOrganic: boolean;
  location: {
    district: string;
    state: string;
  };
  stock?: string;
};

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
  productNames: ProductNameOption[];
  onImagesChange: (files: File[], previews: string[]) => void;
  imagePreviews: string[];
  imageError?: string;
  newProduct: NewProductForm;
  setNewProduct: (data: NewProductForm) => void;
}

const getProductNameLabel = (option: ProductNameOption, lang: string) => {
  if (lang === 'en' || lang === 'hi' || lang === 'kn' || lang === 'mr') {
    return option[lang];
  }
  return option.en;
};

const AddProductDialog: React.FC<AddProductDialogProps> = ({ open, onClose, onSubmit, loading, error, productNames, onImagesChange, imagePreviews, imageError, newProduct, setNewProduct }) => {
  const { t, i18n } = useTranslation();

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const { valid, reason } = await isValidImageFile(file);
      if (!valid) {
        // setProductImageError(reason || 'Invalid image file.'); // This state variable doesn't exist in the current file
        // notify(reason || 'Invalid image file.', 'error'); // This function doesn't exist in the current file
        return;
      }
    }
    // setProductImageFiles(files); // This state variable doesn't exist in the current file
    // setProductImageError(null); // This state variable doesn't exist in the current file
    // ...set previews, etc.
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('dashboard.addNewProduct')}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel id="category-label">{t('dashboard.category')}</InputLabel>
                <Select
                  labelId="category-label"
                  id="category-select"
                  value={newProduct.category as '' | Product['category']}
                  label={t('dashboard.category')}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as '' | Product['category'], name: '' })}
                >
                  <MenuItem value="" disabled>{t('dashboard.selectCategory')}</MenuItem>
                  <MenuItem value="vegetables">{t('dashboard.vegetables')}</MenuItem>
                  <MenuItem value="fruits">{t('dashboard.fruits')}</MenuItem>
                  <MenuItem value="grains">{t('dashboard.grains')}</MenuItem>
                  <MenuItem value="pulses">{t('dashboard.pulses')}</MenuItem>
                  <MenuItem value="oilseeds">{t('dashboard.oilseeds')}</MenuItem>
                  <MenuItem value="spices">{t('dashboard.spices')}</MenuItem>
                  <MenuItem value="dairy">{t('dashboard.dairy')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <Autocomplete
                  options={productNames}
                  getOptionLabel={(option) => getProductNameLabel(option as ProductNameOption, i18n.language as string)}
                  value={productNames.find((p) => p.key === newProduct.name) || undefined}
                  onChange={(e, value) => setNewProduct({ ...newProduct, name: (value as ProductNameOption | undefined)?.key || '' })}
                  renderInput={(params) => (
                    <TextField {...params} label={t('dashboard.productName')} required inputProps={{ ...params.inputProps, readOnly: true }} />
                  )}
                  disabled={!newProduct.category}
                  renderOption={(props, option) => (
                    <li {...props} key={option.key}>
                      {getProductNameLabel(option as ProductNameOption, i18n.language as string)}
                    </li>
                  )}
                  freeSolo={false}
                  disableClearable
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('dashboard.price')}
                type="number"
                fullWidth
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('dashboard.unit')}</InputLabel>
                <Select
                  label={t('dashboard.unit')}
                  value={newProduct.unit as '' | Product['unit']}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value as '' | Product['unit'] })}
                >
                  <MenuItem value="kg">{t('dashboard.kilogram')}</MenuItem>
                  <MenuItem value="g">{t('dashboard.gram')}</MenuItem>
                  <MenuItem value="lb">{t('dashboard.pound')}</MenuItem>
                  <MenuItem value="piece">{t('dashboard.piece')}</MenuItem>
                  <MenuItem value="dozen">{t('dashboard.dozen')}</MenuItem>
                  <MenuItem value="bunch">{t('dashboard.bunch')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('dashboard.availableQuantity')}
                type="number"
                fullWidth
                required
                value={newProduct.availableQuantity}
                onChange={(e) => setNewProduct({ ...newProduct, availableQuantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('dashboard.harvestDate')}
                type="date"
                fullWidth
                required
                value={newProduct.harvestDate}
                onChange={(e) => setNewProduct({ ...newProduct, harvestDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('dashboard.description')}
                multiline
                rows={4}
                fullWidth
                required
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('dashboard.district')}
                fullWidth
                required
                value={newProduct.location.district}
                onChange={(e) => setNewProduct({ ...newProduct, location: { ...newProduct.location, district: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="state-select-label">{t('dashboard.state')}</InputLabel>
                <Select
                  labelId="state-select-label"
                  id="state-select"
                  value={newProduct.location.state}
                  label={t('dashboard.state')}
                  onChange={(e) => setNewProduct({ ...newProduct, location: { ...newProduct.location, state: e.target.value } })}
                >
                  {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map((state) => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newProduct.isOrganic}
                    onChange={(e) => setNewProduct({ ...newProduct, isOrganic: e.target.checked })}
                    color="secondary"
                  />
                }
                label={t('dashboard.organicProduct')}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                {t('dashboard.productImages')}
              </Typography>
              <ImageUpload
                images={imagePreviews}
                onImagesChange={onImagesChange}
                uploading={loading}
                error={imageError}
              />
            </Grid>
          </Grid>
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('dashboard.cancel')}</Button>
        <Button variant="contained" color="primary" onClick={onSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : t('dashboard.addProduct')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductDialog; 
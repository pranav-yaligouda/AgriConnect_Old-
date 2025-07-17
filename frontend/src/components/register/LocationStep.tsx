import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Typography, InputAdornment } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface LocationStepProps {
  values: any;
  errors: any;
  touched: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  handleBlur: (e: React.FocusEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  geo: any;
  enGeo: any;
  getEnglishDistrict: (stateKey: string, translatedDistrict: string) => string;
  getTranslatedDistrict: (stateKey: string, englishDistrict: string) => string;
}

const LocationStep = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  geo,
  enGeo,
  getEnglishDistrict,
  getTranslatedDistrict,
}: LocationStepProps) => {
  const { t } = useTranslation();
  const selectedDistrictTranslated =
    values.state && values.district
      ? getTranslatedDistrict(values.state, values.district)
      : '';
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          id="street"
          name="street"
          label={t('register.talukVillage', 'Taluk/Village')}
          value={values.street}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.street && Boolean(errors.street)}
          helperText={touched.street && errors.street}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <FormControl fullWidth required>
          <InputLabel id="register-state-select-label">{t('register.state')}</InputLabel>
          <Select
            labelId="register-state-select-label"
            id="register-state-select"
            name="state"
            value={values.state}
            label={t('register.state')}
            onChange={(e) => setFieldValue('state', e.target.value)}
            onBlur={handleBlur}
            error={touched.state && Boolean(errors.state)}
          >
            {Object.keys(enGeo.states).map((state) => (
              <MenuItem key={state} value={state}>{geo.states[state]}</MenuItem>
            ))}
          </Select>
          {touched.state && errors.state && (
            <Typography variant="caption" color="error">{errors.state}</Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel id="register-district-select-label">{t('register.district')}</InputLabel>
          <Select
            labelId="register-district-select-label"
            id="register-district-select"
            name="district"
            value={selectedDistrictTranslated}
            label={t('register.district')}
            onChange={(e) => {
              const selectedTranslated = e.target.value;
              const englishDistrict = getEnglishDistrict(values.state, selectedTranslated);
              setFieldValue('district', englishDistrict);
            }}
            onBlur={handleBlur}
            error={touched.district && Boolean(errors.district)}
            disabled={!values.state}
          >
            {(geo.districts[values.state] || []).map((district: string) => (
              <MenuItem key={district} value={district}>{district}</MenuItem>
            ))}
          </Select>
          {touched.district && errors.district && (
            <Typography variant="caption" color="error">{errors.district}</Typography>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          id="zipcode"
          name="zipcode"
          label={t('register.zipcode')}
          value={values.zipcode}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.zipcode && Boolean(errors.zipcode)}
          helperText={touched.zipcode && errors.zipcode}
        />
      </Grid>
    </Grid>
  );
};

export default LocationStep; 
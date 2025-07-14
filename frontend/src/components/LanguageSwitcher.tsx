import React from "react";
import { useTranslation } from "react-i18next";
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { SelectChangeEvent } from '@mui/material/Select';

interface LanguageSwitcherProps {
  drawerMenu?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ drawerMenu }) => {
  const { i18n, t } = useTranslation();
  const handleChange = (event: SelectChangeEvent<string>) => {
    let lang = event.target.value as string;
    if (lang === 'hi-IN') lang = 'hi';
    i18n.changeLanguage(lang);
  };

  // Ensure the value is always one of the supported codes
  const supportedLangs = ['en', 'kn', 'hi', 'mr'];
  let currentLang = i18n.language;
  if (currentLang === 'hi-IN') currentLang = 'hi';
  if (!supportedLangs.includes(currentLang)) currentLang = 'en';

  return (
    <FormControl
      size="small"
      variant="outlined"
      sx={{
        minWidth: 120,
        ml: drawerMenu ? 0 : 2,
        '& .MuiInputLabel-root': {
          color: drawerMenu ? 'black' : 'white',
        },
        '& .MuiOutlinedInput-root': {
          color: drawerMenu ? 'black' : 'white',
          backgroundColor: drawerMenu ? 'white' : 'rgba(255,255,255,0.08)',
          borderRadius: 1,
          '& fieldset': {
            borderColor: drawerMenu ? 'rgba(46,125,50,0.2)' : 'rgba(255,255,255,0.5)',
          },
          '&:hover fieldset': {
            borderColor: drawerMenu ? '#2e7d32' : 'white',
          },
        },
        '& .MuiSvgIcon-root': {
          color: drawerMenu ? 'black' : 'white',
        },
        '& .MuiSelect-icon': {
          color: drawerMenu ? 'black' : 'white',
        },
      }}
    >
      <InputLabel id="lang-select-label" sx={{ color: drawerMenu ? 'black' : 'white' }}>{t('languageSwitcher.language')}</InputLabel>
      <Select
        labelId="lang-select-label"
        id="lang-select"
        value={currentLang}
        label={t('languageSwitcher.language')}
        onChange={handleChange}
        sx={{
          color: drawerMenu ? 'black' : 'white',
          '& .MuiSelect-select': {
            color: drawerMenu ? 'black' : 'white',
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: 'white',
              color: 'black',
              zIndex: 2000, // ensure it's above Drawer
              minWidth: drawerMenu ? 160 : undefined,
            },
          },
          disablePortal: drawerMenu ? true : false,
        }}
      >
        <MenuItem value="en" sx={{ color: 'black', fontWeight: currentLang === 'en' ? 700 : 400 }}>{t('languageSwitcher.english')}</MenuItem>
        <MenuItem value="kn" sx={{ color: 'black', fontWeight: currentLang === 'kn' ? 700 : 400 }}>ಕನ್ನಡ</MenuItem>
        <MenuItem value="hi" sx={{ color: 'black', fontWeight: currentLang === 'hi' ? 700 : 400 }}>हिन्दी</MenuItem>
        <MenuItem value="mr" sx={{ color: 'black', fontWeight: currentLang === 'mr' ? 700 : 400 }}>मराठी</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
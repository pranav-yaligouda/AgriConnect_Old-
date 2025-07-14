import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import knTranslation from './locales/kn/translation.json';
import hiTranslation from './locales/hi/translation.json';
import mrTranslation from './locales/mr/translation.json';
import enFAQ from './locales/en/faq.json';
import knFAQ from './locales/kn/faq.json';
import hiFAQ from './locales/hi/faq.json';
import mrFAQ from './locales/mr/faq.json';
import enMarketplace from './locales/en/marketplace.json';
import knMarketplace from './locales/kn/marketplace.json';
import hiMarketplace from './locales/hi/marketplace.json';
import mrMarketplace from './locales/mr/marketplace.json';
import enDashboard from './locales/en/translation.json';
import knDashboard from './locales/kn/translation.json';
import hiDashboard from './locales/hi/translation.json';
import mrDashboard from './locales/mr/translation.json';
import enProfile from './locales/en/translation.json';
import knProfile from './locales/kn/translation.json';
import hiProfile from './locales/hi/translation.json';
import mrProfile from './locales/mr/translation.json';
import enGeo from './locales/en/geo.json';
import knGeo from './locales/kn/geo.json';
import hiGeo from './locales/hi/geo.json';
import mrGeo from './locales/mr/geo.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation, faq: enFAQ, marketplace: enMarketplace, dashboard: enDashboard, profile: enProfile, geo: enGeo },
      kn: { translation: knTranslation, faq: knFAQ, marketplace: knMarketplace, dashboard: knDashboard, profile: knProfile, geo: knGeo },
      hi: { translation: hiTranslation, faq: hiFAQ, marketplace: hiMarketplace, dashboard: hiDashboard, profile: hiProfile, geo: hiGeo },
      mr: { translation: mrTranslation, faq: mrFAQ, marketplace: mrMarketplace, dashboard: mrDashboard, profile: mrProfile, geo: mrGeo },
    },
    ns: ['translation', 'faq', 'marketplace', 'dashboard', 'profile', 'geo'],
    defaultNS: 'translation',
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

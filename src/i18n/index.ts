import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import only English translations synchronously (default/fallback)
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enHome from './locales/en/home.json';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
];

// Only load English initially - other languages loaded on demand
const resources = {
  en: { common: enCommon, nav: enNav, home: enHome },
};

// Dynamic language loader - loads translations on demand
const loadLanguage = async (lng: string): Promise<boolean> => {
  console.log(`[i18n] loadLanguage called for: ${lng}`);
  
  if (lng === 'en') {
    console.log(`[i18n] English already loaded (default)`);
    return true;
  }
  
  if (i18n.hasResourceBundle(lng, 'common')) {
    console.log(`[i18n] ${lng} translations already loaded`);
    return true;
  }

  try {
    console.log(`[i18n] Loading translations for: ${lng}`);
    const [common, nav, home] = await Promise.all([
      import(`./locales/${lng}/common.json`),
      import(`./locales/${lng}/nav.json`),
      import(`./locales/${lng}/home.json`),
    ]);

    i18n.addResourceBundle(lng, 'common', common.default, true, true);
    i18n.addResourceBundle(lng, 'nav', nav.default, true, true);
    i18n.addResourceBundle(lng, 'home', home.default, true, true);
    
    console.log(`[i18n] Successfully loaded translations for: ${lng}`);
    return true;
  } catch (error) {
    console.error(`[i18n] Failed to load translations for ${lng}:`, error);
    return false;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'nav', 'home'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ziggy-language',
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    // Dev mode: Log missing keys
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (_lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`🌐 Missing translation: [${ns}] ${key}`);
      }
    },
  });

// Listen for language changes and load translations dynamically
i18n.on('languageChanged', (lng) => {
  loadLanguage(lng);
});

// Export the loader for manual preloading if needed
export { loadLanguage };

export default i18n;

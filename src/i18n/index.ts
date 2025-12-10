import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enHome from './locales/en/home.json';

// Import Spanish translations
import esCommon from './locales/es/common.json';
import esNav from './locales/es/nav.json';
import esHome from './locales/es/home.json';

// Import French translations
import frCommon from './locales/fr/common.json';
import frNav from './locales/fr/nav.json';
import frHome from './locales/fr/home.json';

// Import Russian translations
import ruCommon from './locales/ru/common.json';
import ruNav from './locales/ru/nav.json';
import ruHome from './locales/ru/home.json';

// Import Chinese translations
import zhCommon from './locales/zh/common.json';
import zhNav from './locales/zh/nav.json';
import zhHome from './locales/zh/home.json';

// Import Hindi translations
import hiCommon from './locales/hi/common.json';
import hiNav from './locales/hi/nav.json';
import hiHome from './locales/hi/home.json';

// Import Yoruba translations
import yoCommon from './locales/yo/common.json';
import yoNav from './locales/yo/nav.json';
import yoHome from './locales/yo/home.json';

// Import Amharic translations
import amCommon from './locales/am/common.json';
import amNav from './locales/am/nav.json';
import amHome from './locales/am/home.json';

// Import Swahili translations
import swCommon from './locales/sw/common.json';
import swNav from './locales/sw/nav.json';
import swHome from './locales/sw/home.json';

// Import Zulu translations
import zuCommon from './locales/zu/common.json';
import zuNav from './locales/zu/nav.json';
import zuHome from './locales/zu/home.json';

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

const resources = {
  en: { common: enCommon, nav: enNav, home: enHome },
  es: { common: esCommon, nav: esNav, home: esHome },
  fr: { common: frCommon, nav: frNav, home: frHome },
  ru: { common: ruCommon, nav: ruNav, home: ruHome },
  zh: { common: zhCommon, nav: zhNav, home: zhHome },
  hi: { common: hiCommon, nav: hiNav, home: hiHome },
  yo: { common: yoCommon, nav: yoNav, home: yoHome },
  am: { common: amCommon, nav: amNav, home: amHome },
  sw: { common: swCommon, nav: swNav, home: swHome },
  zu: { common: zuCommon, nav: zuNav, home: zuHome },
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

export default i18n;

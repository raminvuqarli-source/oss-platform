import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import az from '../locales/az.json';
import tr from '../locales/tr.json';
import ru from '../locales/ru.json';
import fa from '../locales/fa.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import nl from '../locales/nl.json';
import ar from '../locales/ar.json';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
  es: { translation: es },
  nl: { translation: nl },
  az: { translation: az },
  tr: { translation: tr },
  ru: { translation: ru },
  fa: { translation: fa },
  ar: { translation: ar },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    saveMissing: true,
    missingKeyHandler: (_lngs, _ns, key) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }
    },
  });

export const changeLanguage = async (lng: string) => {
  try { localStorage.setItem('i18nextLng', lng); } catch {}
  await i18n.changeLanguage(lng);
  const language = languages.find(l => l.code === lng);
  if (language) {
    document.documentElement.dir = language.dir;
    document.documentElement.lang = lng;
    if (language.dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }
};

export const getCurrentDirection = () => {
  const currentLang = i18n.language || 'en';
  const language = languages.find(l => l.code === currentLang);
  return language?.dir || 'ltr';
};

const initDir = () => {
  const lang = languages.find(l => l.code === i18n.language);
  if (lang) {
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
    if (lang.dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    }
  }
};

if (i18n.isInitialized) {
  initDir();
} else {
  i18n.on('initialized', initDir);
}

export default i18n;

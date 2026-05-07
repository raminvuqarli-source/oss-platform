import { useTranslation } from 'react-i18next';

const LANG_TO_CURRENCY: Record<string, string> = {
  az: 'AZN',
  tr: 'TRY',
  ru: 'RUB',
  de: 'EUR',
  fr: 'EUR',
  nl: 'EUR',
  es: 'EUR',
  ar: 'AED',
  fa: 'IRR',
  en: 'USD',
};

const CURRENCY_SYMBOL: Record<string, string> = {
  AZN: '₼',
  TRY: '₺',
  RUB: '₽',
  EUR: '€',
  USD: '$',
  AED: 'د.إ',
  IRR: '﷼',
};

export function useCurrency() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const currency = LANG_TO_CURRENCY[lang] || 'USD';
  const symbol = CURRENCY_SYMBOL[currency] || currency;

  function fmt(cents: number): string {
    try {
      return new Intl.NumberFormat(i18n.language || 'en', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(cents / 100);
    } catch {
      return `${symbol}${(cents / 100).toFixed(2)}`;
    }
  }

  return { currency, symbol, fmt };
}

import i18n from './i18n';

const t = () => i18n.t.bind(i18n);

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return t()('time.justNow', 'Just now');
  if (diffMinutes < 60) return t()('time.minutesAgo', { count: diffMinutes });
  if (diffHours < 24) return t()('time.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t()('time.daysAgo', { count: diffDays });
  
  return past.toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = date instanceof Date ? date : new Date(date);
  
  switch (format) {
    case 'full':
      return d.toLocaleDateString(i18n.language, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'long':
      return d.toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'short':
    default:
      return d.toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}

export function formatDateTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 1): string {
  return new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export type ServiceRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'paid' | 'unpaid' | 'pending' | 'voided' | 'refunded';

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'active':
      return 'default';
    case 'in_progress':
    case 'pending':
      return 'secondary';
    case 'cancelled':
    case 'voided':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getStatusLabel(status: string, type: 'service' | 'payment' | 'general' = 'general'): string {
  const prefix = type === 'service' ? 'status.service' : type === 'payment' ? 'status.payment' : 'status';
  return t()(`${prefix}.${status}`, status);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone.startsWith('+')) return phone;
  const digits = phone.slice(1);
  if (digits.length <= 10) return phone;
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
}

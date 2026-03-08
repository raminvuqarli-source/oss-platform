import i18n from './i18n';

// Unified error handling utilities with i18n-translated error messages for API responses

export interface ApiErrorDetails {
  status: number;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  originalMessage: string;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.originalMessage = message;
    this.code = code;
  }
}

export function parseApiError(error: unknown): ApiErrorDetails {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.originalMessage, code: error.code };
  }
  
  if (error instanceof Error) {
    const match = error.message.match(/^(\d+):\s*(.+)$/);
    if (match) {
      const status = parseInt(match[1], 10);
      let message = match[2];
      
      try {
        const parsed = JSON.parse(message);
        message = parsed.message || parsed.error || message;
      } catch {
      }
      
      return { status, message };
    }
    return { status: 0, message: error.message };
  }
  
  if (typeof error === 'string') {
    return { status: 0, message: error };
  }
  
  return { status: 0, message: 'Unknown error' };
}

export function createApiError(response: Response, text: string): ApiError {
  let message = text || response.statusText;
  let code: string | undefined;
  
  try {
    const parsed = JSON.parse(text);
    message = parsed.message || parsed.error || message;
    code = parsed.code || parsed.error;
  } catch {
  }
  
  return new ApiError(response.status, message, code);
}

export function isPlanLimitError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 403 && (error.code === "PLAN_LIMIT" || error.code === "TRIAL_EXPIRED" || error.code === "SMART_PLAN_LIMIT");
  }
  if (error instanceof Error) {
    return error.message.includes("PLAN_LIMIT") || error.message.includes("SMART_PLAN_LIMIT") || error.message.includes("not included in your current subscription") || error.message.includes("not included in your current smart plan");
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  const t = i18n.t.bind(i18n);
  const apiError = parseApiError(error);
  
  if (apiError.status === 401) {
    const lowerMessage = apiError.message.toLowerCase();
    if (lowerMessage.includes('invalid') || lowerMessage.includes('credentials') || lowerMessage.includes('password') || lowerMessage.includes('username')) {
      return t('errors.invalidCredentials');
    }
    if (lowerMessage.includes('session') || lowerMessage.includes('expired') || lowerMessage.includes('token')) {
      return t('errors.sessionExpired');
    }
    return t('errors.unauthorized');
  }
  
  if (apiError.status === 403) {
    return t('errors.forbidden');
  }
  
  if (apiError.status === 404) {
    return t('errors.notFound');
  }
  
  if (apiError.status === 409) {
    if (apiError.message && apiError.message.length > 0) {
      return apiError.message;
    }
    return t('errors.conflict');
  }
  
  if (apiError.status === 422 || apiError.status === 400) {
    if (apiError.message && apiError.message.length > 0) {
      return apiError.message;
    }
    return t('errors.invalidInput');
  }
  
  if (apiError.status >= 500) {
    return t('errors.serverError');
  }
  
  if (apiError.status === 0) {
    if (apiError.message.toLowerCase().includes('network') || apiError.message.toLowerCase().includes('fetch')) {
      return t('errors.networkError');
    }
  }
  
  return t('errors.somethingWentWrong');
}

export function getErrorTitle(error: unknown): string {
  const t = i18n.t.bind(i18n);
  const apiError = parseApiError(error);
  
  if (apiError.status === 401) {
    return t('errors.authenticationFailed');
  }
  
  if (apiError.status === 403) {
    return t('errors.accessDenied');
  }
  
  if (apiError.status === 404) {
    return t('errors.notFoundTitle');
  }
  
  if (apiError.status === 409) {
    return t('errors.conflictTitle');
  }
  
  if (apiError.status === 422 || apiError.status === 400) {
    return t('errors.invalidInputTitle');
  }
  
  if (apiError.status >= 500) {
    return t('errors.serverErrorTitle');
  }
  
  return t('errors.errorTitle');
}

export function showErrorToast(
  toast: (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void,
  error: unknown
): void {
  toast({
    title: getErrorTitle(error),
    description: getErrorMessage(error),
    variant: 'destructive',
  });
}

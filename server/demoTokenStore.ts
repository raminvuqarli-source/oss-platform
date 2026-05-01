const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface DemoTokenData {
  userId: number;
  role: string;
  demoSessionTenantId: string;
  expiresAt: number;
}

const store = new Map<string, DemoTokenData>();

export function createDemoToken(userId: number, role: string, demoSessionTenantId: string): string {
  const token = crypto.randomUUID();
  store.set(token, {
    userId,
    role,
    demoSessionTenantId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

export function resolveDemoToken(token: string): DemoTokenData | null {
  const data = store.get(token);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    store.delete(token);
    return null;
  }
  return data;
}

export function deleteDemoToken(token: string): void {
  store.delete(token);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now > val.expiresAt) store.delete(key);
  }
}, 30 * 60 * 1000);

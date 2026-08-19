// Safe storage interface supporting custom window.storage or standard localStorage fallback

declare global {
  interface Window {
    storage?: {
      get: (key: string, shared?: boolean) => Promise<{ value: string } | null>;
      set: (key: string, value: string, shared?: boolean) => Promise<void>;
    };
  }
}

export async function safeGet<T>(key: string, shared = false): Promise<T | null> {
  try {
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
      const res = await window.storage.get(key, shared);
      if (res && res.value) {
        return JSON.parse(res.value) as T;
      }
    }
  } catch (e) {
    console.warn(`window.storage.get failed for ${key}, falling back to localStorage:`, e);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    }
  } catch (e) {
    console.error(`localStorage.getItem failed for ${key}:`, e);
  }

  return null;
}

export async function safeSet<T>(key: string, data: T, shared = false): Promise<void> {
  const serialized = JSON.stringify(data);

  try {
    if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(key, serialized, shared);
    }
  } catch (e) {
    console.warn(`window.storage.set failed for ${key}, using localStorage:`, e);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
    }
  } catch (e) {
    console.error(`localStorage.setItem failed for ${key}:`, e);
  }
}

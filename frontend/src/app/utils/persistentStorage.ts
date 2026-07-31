import { API_URL } from '@/app/utils/api';

type StorageScope = 'local' | 'session';

interface StorageState {
  scope: StorageScope;
  data: Map<string, string>;
}

const STORAGE_READY_FLAG = Symbol('honeyPersistentStorageReady');
const nativeMethods = {
  getItem: Storage.prototype.getItem,
  setItem: Storage.prototype.setItem,
  removeItem: Storage.prototype.removeItem,
  clear: Storage.prototype.clear,
  key: Storage.prototype.key,
};

const storageStates = new WeakMap<Storage, StorageState>();

let bootstrapPromise: Promise<void> | null = null;
let methodsInstalled = false;

function getScope(storage: Storage): StorageScope | null {
  if (typeof window === 'undefined') return null;
  if (storage === window.localStorage) return 'local';
  if (storage === window.sessionStorage) return 'session';
  return null;
}

function getState(storage: Storage): StorageState | null {
  return storageStates.get(storage) || null;
}

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || response.statusText || 'Storage request failed');
  }

  return data;
}

function snapshotStorage(storage: Storage): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let index = 0; ; index += 1) {
    const key = nativeMethods.key.call(storage, index);
    if (!key) {
      break;
    }
    const value = nativeMethods.getItem.call(storage, key);
    if (value !== null) {
      entries[key] = value;
    }
  }
  return entries;
}

async function hydrateScope(storage: Storage, scope: StorageScope) {
  const state = getState(storage);
  if (!state) return;

  const localSnapshot = snapshotStorage(storage);
  const remote = await requestJson(`/storage/${scope}`);
  const remoteEntries = (remote?.entries && typeof remote.entries === 'object') ? remote.entries as Record<string, unknown> : {};

  const merged = new Map<string, string>();
  Object.entries(remoteEntries).forEach(([key, value]) => {
    merged.set(key, String(value ?? ''));
  });

  Object.entries(localSnapshot).forEach(([key, value]) => {
    merged.set(key, value);
  });

  state.data = merged;

  if (Object.keys(localSnapshot).length > 0) {
    await requestJson(`/storage/${scope}`, {
      method: 'POST',
      body: JSON.stringify({ entries: localSnapshot }),
    });

    nativeMethods.clear.call(storage);
  }

  await requestJson(`/storage/${scope}`, {
    method: 'POST',
    body: JSON.stringify({ entries: Object.fromEntries(merged.entries()) }),
  });
}

function patchStorageMethods() {
  if (methodsInstalled || typeof window === 'undefined') return;

  const prototype = window.Storage.prototype as Storage & { [STORAGE_READY_FLAG]?: boolean };

  if (!prototype[STORAGE_READY_FLAG]) {
    Object.defineProperty(prototype, 'getItem', {
      configurable: true,
      value(this: Storage, key: string) {
        const state = getState(this);
        if (!state) {
          return nativeMethods.getItem.call(this, key);
        }
        return state.data.has(key) ? state.data.get(key)! : null;
      },
    });

    Object.defineProperty(prototype, 'setItem', {
      configurable: true,
      value(this: Storage, key: string, value: string) {
        const state = getState(this);
        if (!state) {
          nativeMethods.setItem.call(this, key, value);
          return;
        }

        state.data.set(key, String(value));
        void requestJson(`/storage/${state.scope}/${encodeURIComponent(key)}`, {
          method: 'PUT',
          body: JSON.stringify({ value: String(value) }),
        }).catch((error) => {
          console.error('Failed to sync persistent storage setItem:', error);
        });
      },
    });

    Object.defineProperty(prototype, 'removeItem', {
      configurable: true,
      value(this: Storage, key: string) {
        const state = getState(this);
        if (!state) {
          nativeMethods.removeItem.call(this, key);
          return;
        }

        state.data.delete(key);
        void requestJson(`/storage/${state.scope}/${encodeURIComponent(key)}`, {
          method: 'DELETE',
        }).catch((error) => {
          console.error('Failed to sync persistent storage removeItem:', error);
        });
      },
    });

    Object.defineProperty(prototype, 'clear', {
      configurable: true,
      value(this: Storage) {
        const state = getState(this);
        if (!state) {
          nativeMethods.clear.call(this);
          return;
        }

        state.data.clear();
        void requestJson(`/storage/${state.scope}`, {
          method: 'DELETE',
        }).catch((error) => {
          console.error('Failed to sync persistent storage clear:', error);
        });
      },
    });

    Object.defineProperty(prototype, 'key', {
      configurable: true,
      value(this: Storage, index: number) {
        const state = getState(this);
        if (!state) {
          return nativeMethods.key.call(this, index);
        }
        return Array.from(state.data.keys())[index] ?? null;
      },
    });

    prototype[STORAGE_READY_FLAG] = true;
  }

  methodsInstalled = true;
}

export async function initializePersistentStorage() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  if (typeof window === 'undefined') {
    bootstrapPromise = Promise.resolve();
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    patchStorageMethods();

    storageStates.set(window.localStorage, {
      scope: 'local',
      data: new Map(),
    });

    storageStates.set(window.sessionStorage, {
      scope: 'session',
      data: new Map(),
    });

    await requestJson('/storage/bootstrap');
    await Promise.all([
      hydrateScope(window.localStorage, 'local'),
      hydrateScope(window.sessionStorage, 'session'),
    ]);
  })();

  return bootstrapPromise;
}

export function isPersistentStorageReady() {
  return !!bootstrapPromise;
}

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'cc_access_token';
const REFRESH_KEY = 'cc_refresh_token';

// expo-secure-store has no web implementation — fall back to localStorage there (web is only
// used for local preview in this project, not a real deployment target for secure storage).
const webStorage = {
  getItem: async (k: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: async (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  deleteItem: async (k: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

// Exported so other local-only preferences (e.g. the notifications toggle) can reuse the
// same cross-platform storage instead of duplicating the web/SecureStore split.
export const storage =
  Platform.OS === 'web'
    ? webStorage
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        deleteItem: SecureStore.deleteItemAsync,
      };

export async function getAccessToken(): Promise<string | null> {
  return storage.getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return storage.getItem(REFRESH_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await storage.setItem(ACCESS_KEY, accessToken);
  await storage.setItem(REFRESH_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await storage.deleteItem(ACCESS_KEY);
  await storage.deleteItem(REFRESH_KEY);
}

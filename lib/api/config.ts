import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 4000;

/**
 * Resolves the backend's base URL automatically for local development:
 * - Reads the Metro bundler's own host (same LAN IP your phone already uses to load the app
 *   in Expo Go) and swaps its port for the API server's port — so this works with zero config
 *   whether you're on the simulator, web, or a physical device on the same Wi-Fi.
 * - Set EXPO_PUBLIC_API_URL to override (e.g. for a deployed backend) — takes priority.
 *
 * Known limitation: this does NOT work over `expo start --tunnel` (the tunnel's host isn't your
 * machine's LAN address) — use EXPO_PUBLIC_API_URL with a reachable URL in that case.
 */
function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${API_PORT}/api`;
  }

  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}/api` : `http://localhost:${API_PORT}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();

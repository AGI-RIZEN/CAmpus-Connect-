import { API_BASE_URL } from './config';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token-storage';

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

/** True specifically for a failed fetch() — no connection reached the server at all — as
 *  opposed to the server responding with a real error status (4xx/5xx). apiRequest() below
 *  throws status 0 only from its fetch-level catch, never from a server response, so this is a
 *  reliable "the user is offline" signal without needing any network-detection dependency. */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiRequestError && err.status === 0;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the stored access token, and silently retry once via refresh on a 401. */
  auth?: boolean;
};

// Coalesces concurrent 401s into a single refresh call instead of firing one per request.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

/** Shared by apiRequest() and any caller that does its own fetch() (e.g. multipart uploads,
 *  which can't go through apiRequest's JSON body handling) so a 401 from an expired access
 *  token gets one coalesced refresh-and-retry instead of silently failing outside this module. */
export async function getRefreshedAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const buildHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const doFetch = async () =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: await buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    throw new ApiRequestError(0, `Can't reach the server — check it's running and reachable (${(err as Error).message})`);
  }

  if (res.status === 401 && auth) {
    const newToken = await getRefreshedAccessToken();
    if (newToken) {
      res = await doFetch();
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(res.status, (data as any).error ?? 'Something went wrong');
  }

  return data as T;
}

import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { getAccessToken } from './token-storage';
import { ApiRequestError, getRefreshedAccessToken } from './client';

type UploadResult = { assetId: string; url: string };

/** Picked image info worth passing straight from `expo-image-picker`'s result `asset` object —
 * its `mimeType`/`fileName` come from the OS and are far more reliable than guessing from the
 * `uri` string (e.g. Android content:// URIs have no file extension to parse at all). */
type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null };

function guessTypeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return 'image/jpeg';
}

/**
 * On native, React Native's fetch polyfill special-cases a plain `{uri, name, type}` object
 * passed to `FormData.append` — it streams the file straight from that URI. On web there's no
 * such polyfill; `FormData` is the real browser one, which silently stringifies anything that
 * isn't an actual `Blob`/`File` (so the server would receive a text field reading
 * "[object Object]" instead of a file, and 400 with "No file uploaded"). Web's `image.uri` is a
 * `data:`/`blob:` URL, which `fetch()` can resolve directly into a real Blob.
 */
async function fileFromPickedImage(image: PickedImage): Promise<Blob> {
  const type = image.mimeType || guessTypeFromUri(image.uri);
  const name = image.fileName || image.uri.split('/').pop() || 'photo.jpg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(image.uri)).blob();
    return new File([blob], name, { type: blob.type || type });
  }
  return { uri: image.uri, name, type } as unknown as Blob;
}

/**
 * Uploads a profile photo picked during signup, before the account has a real session.
 * `avatarUploadToken` comes from the signup() response — a short-lived token scoped to exactly
 * this account, so the server never has to trust a client-supplied userId for this.
 */
export async function uploadAvatarForSignup(avatarUploadToken: string, image: PickedImage): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', await fileFromPickedImage(image));

  const res = await fetch(`${API_BASE_URL}/uploads/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${avatarUploadToken}` },
    body: form as any,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiRequestError(res.status, data.error ?? 'Could not upload photo');
  return data as UploadResult;
}

/** General authenticated upload (post images, chat attachments, etc.).
 *  Uses a raw fetch() (multipart body, not JSON) so it can't go through apiRequest() — but
 *  that means it needs its own 401-refresh-and-retry, same as apiRequest does, otherwise an
 *  access token that expired while the user was still picking/composing fails the upload
 *  outright instead of transparently refreshing like every other request in the app. */
export async function uploadFile(image: PickedImage): Promise<UploadResult> {
  const doUpload = async (token: string | null) => {
    const form = new FormData();
    form.append('file', await fileFromPickedImage(image));
    return fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form as any,
    });
  };

  let token = await getAccessToken();
  let res = await doUpload(token);

  if (res.status === 401) {
    token = await getRefreshedAccessToken();
    if (token) res = await doUpload(token);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiRequestError(res.status, data.error ?? 'Could not upload file');
  return data as UploadResult;
}

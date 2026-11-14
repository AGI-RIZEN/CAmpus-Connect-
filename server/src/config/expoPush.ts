type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // Expo's push API accepts at most 100 messages per request.

/** Best-effort — a push delivery failure should never block the action that triggered it
 *  (e.g. publishing a notice). The in-app Notification row is the source of truth; this is
 *  just the real-device nudge on top of it. */
export async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.error('[push] Expo push API returned', res.status, await res.text());
      }
    } catch (err) {
      console.error('[push] failed to send push batch (non-fatal):', (err as Error).message);
    }
  }
}

import { z } from 'zod';

// Empty string is a valid value here — it's how the client clears the stored token when
// the user disables notifications in Settings.
export const registerPushTokenSchema = z.object({
  token: z.string(),
});

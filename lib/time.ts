/** "2h ago" / "3d ago" style relative time from an ISO timestamp. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Oct 12, 2026" style absolute date from an ISO timestamp. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "9:02 AM" style clock time from an ISO timestamp — for chat message bubbles.
 *  Uses plain Date getters instead of toLocaleTimeString(): Hermes's Intl/timezone support
 *  isn't reliable on every device and can silently format in UTC instead of local time,
 *  showing a time that's off by the device's UTC offset. getHours()/getMinutes() always read
 *  the OS's local time directly, with no Intl dependency. */
export function formatClockTime(iso: string): string {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

/** "5h left" / "Closed" / "No deadline" style label for a poll's optional close time. */
export function timeLeftLabel(iso: string | null): string {
  if (!iso) return 'No deadline';
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'Closed';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

/** "in 2d 4h" / "in 20m" / "Starting now" style countdown-to-a-future-ISO-timestamp label. */
export function startsInLabel(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'Starting now';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins > 0 ? `in ${hours}h ${remMins}m` : `in ${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `in ${days}d ${remHours}h` : `in ${days}d`;
}

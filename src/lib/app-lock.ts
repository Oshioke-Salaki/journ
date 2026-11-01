/**
 * App lock: a code that hides JournApp on this device until it is entered, for shared phones.
 * It is a privacy screen, not encryption: the code is stored as a salted PBKDF2 hash in this
 * browser only, and forgetting it means signing out and back in with the account password.
 */

export const LOCK_KEY = "journapp:lock";
/** sessionStorage: when the app was last unlocked and in use. A new tab or cold start has none. */
export const ACTIVE_KEY = "journapp:active-at";

export const LOCK_AFTER = [
  { value: 0, label: "Immediately" },
  { value: 1, label: "After 1 minute" },
  { value: 5, label: "After 5 minutes" },
  { value: 15, label: "After 15 minutes" },
] as const;

export type LockConfig = { salt: string; hash: string; minutes: number };

/**
 * Hides everything but the lock screen while locked. Inlined in <head> with the script (not in
 * globals.css), so no CSS build step can drop or reorder it.
 */
export const lockStyle = "html[data-locked] body>:not([data-app-lock]){visibility:hidden!important}";

/** Runs before first paint (inlined in <head>): hides the app at once if it should be locked. */
export const lockScript = `(function(){try{var c=JSON.parse(localStorage.getItem("${LOCK_KEY}")||"null");if(!c)return;var a=Number(sessionStorage.getItem("${ACTIVE_KEY}")||0);if(!a||Date.now()-a>c.minutes*60000){document.documentElement.setAttribute("data-locked","")}}catch(e){}})();`;

export function readLock(): LockConfig | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    const parsed = raw ? (JSON.parse(raw) as LockConfig) : null;
    return parsed && typeof parsed.hash === "string" && typeof parsed.salt === "string" ? parsed : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
export function subscribeLock(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === LOCK_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
const changed = () => listeners.forEach((l) => l());

/** The raw value, for useSyncExternalStore (a stable string, not a new object each read). */
export function lockSnapshot() {
  try {
    return localStorage.getItem(LOCK_KEY);
  } catch {
    return null;
  }
}

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

async function derive(code: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: 150_000 }, key, 256);
  return toHex(bits);
}

export const CODE_PATTERN = /^\d{4,6}$/;

export async function setLock(code: string, minutes: number) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const config: LockConfig = { salt: toHex(salt.buffer), hash: await derive(code, salt), minutes };
  localStorage.setItem(LOCK_KEY, JSON.stringify(config));
  markActive();
  changed();
}

export function setLockMinutes(minutes: number) {
  const config = readLock();
  if (!config) return;
  localStorage.setItem(LOCK_KEY, JSON.stringify({ ...config, minutes }));
  changed();
}

export function removeLock() {
  try {
    localStorage.removeItem(LOCK_KEY);
    sessionStorage.removeItem(ACTIVE_KEY);
  } catch {}
  document.documentElement.removeAttribute("data-locked");
  changed();
}

export async function checkCode(code: string) {
  const config = readLock();
  if (!config) return true;
  return (await derive(code, fromHex(config.salt))) === config.hash;
}

export function markActive() {
  try {
    sessionStorage.setItem(ACTIVE_KEY, String(Date.now()));
  } catch {}
}

export function lastActive() {
  try {
    return Number(sessionStorage.getItem(ACTIVE_KEY) || 0);
  } catch {
    return 0;
  }
}

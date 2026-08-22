"use client";
import { useSyncExternalStore } from "react";
import type { Identity } from "./types";

/**
 * Who you are in one room, kept per room so the same browser can be a
 * different person in a different room.
 *
 * localStorage is an external store, so components read it through
 * useSyncExternalStore rather than copying it into state on mount. That keeps
 * server and client render honest and means a save or a clear anywhere in the
 * app reaches every component that cares.
 */
const key = (code: string) => `yp:${code.toUpperCase()}`;

/** Rendered on the server, where there is no storage to read yet. */
export const UNKNOWN = "unknown";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab in the same room counts as a change worth hearing about.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(code: string): string | null {
  try {
    return window.localStorage.getItem(key(code));
  } catch {
    return null;
  }
}

/**
 * The stored identity, or null once we know there is none, or UNKNOWN while
 * still rendering on the server. The raw string is what gets compared between
 * renders, so callers get a stable value instead of a fresh object every time.
 */
export function useIdentity(code: string): Identity | null | typeof UNKNOWN {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(code),
    () => UNKNOWN as string | null,
  );

  if (raw === UNKNOWN) return UNKNOWN;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (!parsed.token || !parsed.participantId) return null;
    return { token: parsed.token, participantId: parsed.participantId, name: parsed.name ?? "" };
  } catch {
    return null;
  }
}

export function saveIdentity(code: string, identity: Identity): void {
  try {
    window.localStorage.setItem(key(code), JSON.stringify(identity));
  } catch {
    // A browser with storage blocked still works for one sitting, it just
    // forgets you on refresh. Nothing here is worth failing a join over.
  }
  notify();
}

export function clearIdentity(code: string): void {
  try {
    window.localStorage.removeItem(key(code));
  } catch {
    // See above.
  }
  notify();
}

/** Remembered between rooms so the second room does not ask your name again. */
export function useRememberedName(): string {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem("yp:name") ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
}

export function rememberName(name: string): void {
  try {
    window.localStorage.setItem("yp:name", name);
  } catch {
    // See above.
  }
  notify();
}

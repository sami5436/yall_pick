import "server-only";
import { admin, supabaseServiceRoleKey, supabaseUrl } from "./supabase-admin";
import { normalizeCode } from "./codes";
import type { Phase } from "./types";

export type RoomRow = {
  id: string;
  code: string;
  title: string;
  phase: Phase;
};

export type ParticipantRow = {
  id: string;
  room_id: string;
  name: string;
  is_host: boolean;
  finished: boolean;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

/** Wraps a handler so ApiError turns into a clean status and anything else is a 500. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[yallpick]", error);
    return Response.json({ error: "Something broke on our end." }, { status: 500 });
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Expected a JSON body.");
  }
}

export async function loadRoom(rawCode: string): Promise<RoomRow> {
  const code = normalizeCode(rawCode);
  const { data, error } = await admin
    .from("rooms")
    .select("id, code, title, phase")
    .eq("code", code)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "That room does not exist. Check the code.");
  return data as RoomRow;
}

function tokenFrom(request: Request): string {
  const token = request.headers.get("x-yp-token");
  if (!token) throw new ApiError(401, "Join the room first.");
  return token;
}

export async function requireParticipant(
  rawCode: string,
  request: Request,
): Promise<{ room: RoomRow; me: ParticipantRow }> {
  const room = await loadRoom(rawCode);
  const { data, error } = await admin
    .from("participants")
    .select("id, room_id, name, is_host, finished")
    .eq("room_id", room.id)
    .eq("token", tokenFrom(request))
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(401, "Join the room first.");
  return { room, me: data as ParticipantRow };
}

export async function requireHost(rawCode: string, request: Request) {
  const context = await requireParticipant(rawCode, request);
  if (!context.me.is_host) throw new ApiError(403, "Only whoever started the room can do that.");
  return context;
}

export function requirePhase(room: RoomRow, phase: Phase, message: string) {
  if (room.phase !== phase) throw new ApiError(409, message);
}

/**
 * Nudge every open tab in the room to refetch.
 *
 * Deliberately carries no payload. Realtime is the one channel a browser can
 * listen to without going through an authorized handler, so nothing about who
 * voted what is ever put on it. Clients hear "something changed" and ask the
 * server for their own view.
 */
export async function notifyRoom(code: string): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({
        messages: [{ topic: `room:${code}`, event: "changed", payload: {} }],
      }),
    });
  } catch (error) {
    // Clients poll as well, so a dropped nudge costs a few seconds, not correctness.
    console.error("[yallpick] broadcast failed", error);
  }
}

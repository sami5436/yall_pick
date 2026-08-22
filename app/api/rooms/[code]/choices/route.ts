import {
  ApiError,
  handle,
  json,
  notifyRoom,
  readJson,
  requireParticipant,
  requirePhase,
} from "@/lib/api";
import { admin } from "@/lib/supabase-admin";
import { buildState } from "@/lib/state";
import { MAX_CHOICES, requireChoiceLabel } from "@/lib/validate";

type AddBody = { label?: string };

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const { room, me } = await requireParticipant(code, request);
    requirePhase(room, "lobby", "Voting already started, so the list is locked.");

    const body = await readJson<AddBody>(request);
    const label = requireChoiceLabel(body.label);

    const { data: existing, error: readError } = await admin
      .from("choices")
      .select("id, label, position")
      .eq("room_id", room.id);
    if (readError) throw new ApiError(500, readError.message);

    const choices = existing ?? [];
    if (choices.length >= MAX_CHOICES) {
      throw new ApiError(409, `That is already ${MAX_CHOICES} choices. Plenty to pick from.`);
    }
    if (choices.some((c) => (c.label as string).toLowerCase() === label.toLowerCase())) {
      throw new ApiError(409, "Somebody already added that one.");
    }

    const nextPosition = choices.reduce((max, c) => Math.max(max, c.position as number), -1) + 1;

    const { error } = await admin
      .from("choices")
      .insert({ room_id: room.id, label, added_by: me.id, position: nextPosition });
    if (error) throw new ApiError(500, error.message);

    await notifyRoom(room.code);
    return json(await buildState(room, me), 201);
  });
}

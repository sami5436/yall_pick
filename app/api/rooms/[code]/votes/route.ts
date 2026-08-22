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
import { buildState, maybeReveal } from "@/lib/state";
import type { VoteValue } from "@/lib/types";

type VoteBody = { choiceId?: string; value?: number; finished?: boolean };

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const { room, me } = await requireParticipant(code, request);
    requirePhase(room, "voting", "The room is not taking votes right now.");

    const body = await readJson<VoteBody>(request);

    if (body.choiceId !== undefined) {
      await castVote(room.id, me.id, body.choiceId, body.value);
    }

    let currentRoom = room;
    let currentMe = me;

    if (body.finished !== undefined) {
      currentMe = await setFinished(room.id, me.id, body.finished);
      currentRoom = body.finished ? await maybeReveal(room) : room;
    }

    await notifyRoom(room.code);
    return json(await buildState(currentRoom, currentMe));
  });
}

async function castVote(roomId: string, participantId: string, choiceId: string, value: unknown) {
  if (value !== -1 && value !== 0 && value !== 1) {
    throw new ApiError(400, "A vote is yes, meh or no.");
  }

  const { data: choice, error: choiceError } = await admin
    .from("choices")
    .select("id")
    .eq("id", choiceId)
    .eq("room_id", roomId)
    .maybeSingle();
  if (choiceError) throw new ApiError(500, choiceError.message);
  if (!choice) throw new ApiError(404, "That choice is not in this room.");

  const { error } = await admin.from("votes").upsert(
    {
      participant_id: participantId,
      choice_id: choiceId,
      value: value as VoteValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id,choice_id" },
  );
  if (error) throw new ApiError(500, error.message);
}

async function setFinished(roomId: string, participantId: string, finished: boolean) {
  if (finished) {
    // Finishing means finishing. Anything less and the tally would count a
    // half filled ballot as a full one.
    const [choices, votes] = await Promise.all([
      admin.from("choices").select("id", { count: "exact", head: true }).eq("room_id", roomId),
      admin
        .from("votes")
        .select("choice_id", { count: "exact", head: true })
        .eq("participant_id", participantId),
    ]);
    if (choices.error) throw new ApiError(500, choices.error.message);
    if (votes.error) throw new ApiError(500, votes.error.message);
    if ((votes.count ?? 0) < (choices.count ?? 0)) {
      throw new ApiError(409, "You still have choices left to vote on.");
    }
  }

  const { data, error } = await admin
    .from("participants")
    .update({ finished })
    .eq("id", participantId)
    .select("id, room_id, name, is_host, finished")
    .single();
  if (error) throw new ApiError(500, error.message);
  return data;
}

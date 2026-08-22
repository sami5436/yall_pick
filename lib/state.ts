import "server-only";
import { admin } from "./supabase-admin";
import { ApiError, type ParticipantRow, type RoomRow } from "./api";
import { tally } from "./results";
import type { RoomState, VoteValue } from "./types";

/**
 * Build the snapshot one caller is allowed to see.
 *
 * This is the only function that shapes room data for a browser, so the
 * privacy rule lives in exactly one place: other people's votes are read here
 * only to be aggregated, and only after the room reaches the results phase.
 */
export async function buildState(room: RoomRow, me: ParticipantRow): Promise<RoomState> {
  const [participantsResult, choicesResult, myVotesResult] = await Promise.all([
    admin
      .from("participants")
      .select("id, name, is_host, finished")
      .eq("room_id", room.id)
      .order("joined_at", { ascending: true }),
    admin
      .from("choices")
      .select("id, label, added_by, position")
      .eq("room_id", room.id)
      .order("position", { ascending: true }),
    admin.from("votes").select("choice_id, value").eq("participant_id", me.id),
  ]);

  if (participantsResult.error) throw new ApiError(500, participantsResult.error.message);
  if (choicesResult.error) throw new ApiError(500, choicesResult.error.message);
  if (myVotesResult.error) throw new ApiError(500, myVotesResult.error.message);

  const participants = (participantsResult.data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    isHost: p.is_host as boolean,
    finished: p.finished as boolean,
  }));

  const nameById = new Map(participants.map((p) => [p.id, p.name]));

  const choices = (choicesResult.data ?? []).map((c) => ({
    id: c.id as string,
    label: c.label as string,
    addedById: (c.added_by as string | null) ?? null,
    addedByName: c.added_by ? (nameById.get(c.added_by as string) ?? null) : null,
  }));

  const myVotes: Record<string, VoteValue> = {};
  for (const vote of myVotesResult.data ?? []) {
    myVotes[vote.choice_id as string] = vote.value as VoteValue;
  }

  let results = null;
  if (room.phase === "results") {
    const choiceIds = choices.map((c) => c.id);
    const votes = choiceIds.length
      ? await admin
          .from("votes")
          .select("participant_id, choice_id, value")
          .in("choice_id", choiceIds)
      : { data: [], error: null };

    if (votes.error) throw new ApiError(500, votes.error.message);

    results = tally(
      choices,
      (votes.data ?? []) as { participant_id: string; choice_id: string; value: VoteValue }[],
      participants.filter((p) => p.finished).map((p) => p.id),
    );
  }

  return {
    room: { code: room.code, title: room.title, phase: room.phase },
    me: { id: me.id, name: me.name, isHost: me.is_host, finished: me.finished },
    participants,
    choices,
    myVotes,
    results,
  };
}

/**
 * Flip a room to results once every person in it has finished.
 *
 * The check and the write live together, and the update is guarded on the room
 * still being in the voting phase, so two people finishing at the same instant
 * cannot both decide the other will handle the transition.
 */
export async function maybeReveal(room: RoomRow): Promise<RoomRow> {
  if (room.phase !== "voting") return room;

  const { data, error } = await admin
    .from("participants")
    .select("id, finished")
    .eq("room_id", room.id);

  if (error) throw new ApiError(500, error.message);
  const everyone = data ?? [];
  if (everyone.length === 0 || everyone.some((p) => !p.finished)) return room;

  const { data: updated, error: updateError } = await admin
    .from("rooms")
    .update({ phase: "results" })
    .eq("id", room.id)
    .eq("phase", "voting")
    .select("id, code, title, phase")
    .maybeSingle();

  if (updateError) throw new ApiError(500, updateError.message);
  return (updated as RoomRow | null) ?? { ...room, phase: "results" };
}

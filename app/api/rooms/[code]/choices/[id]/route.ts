import { ApiError, handle, json, notifyRoom, requireParticipant, requirePhase } from "@/lib/api";
import { admin } from "@/lib/supabase-admin";
import { buildState } from "@/lib/state";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> },
) {
  return handle(async () => {
    const { code, id } = await params;
    const { room, me } = await requireParticipant(code, request);
    requirePhase(room, "lobby", "Voting already started, so the list is locked.");

    const { data: choice, error: readError } = await admin
      .from("choices")
      .select("id, added_by")
      .eq("id", id)
      .eq("room_id", room.id)
      .maybeSingle();
    if (readError) throw new ApiError(500, readError.message);
    if (!choice) throw new ApiError(404, "That choice is already gone.");

    if (choice.added_by !== me.id && !me.is_host) {
      throw new ApiError(403, "You can only take back the ones you added.");
    }

    const { error } = await admin.from("choices").delete().eq("id", id).eq("room_id", room.id);
    if (error) throw new ApiError(500, error.message);

    await notifyRoom(room.code);
    return json(await buildState(room, me));
  });
}

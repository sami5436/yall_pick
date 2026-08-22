import { ApiError, handle, json, notifyRoom, requireHost, requirePhase } from "@/lib/api";
import { admin } from "@/lib/supabase-admin";
import { buildState } from "@/lib/state";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const { room, me } = await requireHost(code, request);
    requirePhase(room, "lobby", "Voting already started.");

    const { count, error: countError } = await admin
      .from("choices")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);
    if (countError) throw new ApiError(500, countError.message);
    if ((count ?? 0) < 2) throw new ApiError(409, "Add at least two choices first.");

    const { data, error } = await admin
      .from("rooms")
      .update({ phase: "voting" })
      .eq("id", room.id)
      .eq("phase", "lobby")
      .select("id, code, title, phase")
      .maybeSingle();
    if (error) throw new ApiError(500, error.message);

    await notifyRoom(room.code);
    return json(await buildState(data ?? { ...room, phase: "voting" }, me));
  });
}

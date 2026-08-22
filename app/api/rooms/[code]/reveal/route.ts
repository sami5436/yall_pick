import { ApiError, handle, json, notifyRoom, requireHost, requirePhase } from "@/lib/api";
import { admin } from "@/lib/supabase-admin";
import { buildState } from "@/lib/state";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const { room, me } = await requireHost(code, request);
    requirePhase(room, "voting", "Nothing to reveal yet.");

    const { data, error } = await admin
      .from("rooms")
      .update({ phase: "results" })
      .eq("id", room.id)
      .eq("phase", "voting")
      .select("id, code, title, phase")
      .maybeSingle();
    if (error) throw new ApiError(500, error.message);

    await notifyRoom(room.code);
    return json(await buildState(data ?? { ...room, phase: "results" }, me));
  });
}

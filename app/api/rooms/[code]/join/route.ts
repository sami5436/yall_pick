import { ApiError, handle, json, loadRoom, notifyRoom } from "@/lib/api";
import { admin } from "@/lib/supabase-admin";
import { secretToken } from "@/lib/codes";
import { MAX_PARTICIPANTS, cleanName } from "@/lib/validate";

type JoinBody = { name?: string };

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const room = await loadRoom(code);
    const body = (await request.json().catch(() => ({}))) as JoinBody;
    const name = cleanName(body.name);

    const existingToken = request.headers.get("x-yp-token");
    if (existingToken) {
      const { data } = await admin
        .from("participants")
        .select("id")
        .eq("room_id", room.id)
        .eq("token", existingToken)
        .maybeSingle();
      if (data) {
        return json({ code: room.code, token: existingToken, participantId: data.id, name });
      }
    }

    const { count, error: countError } = await admin
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);
    if (countError) throw new ApiError(500, countError.message);
    if ((count ?? 0) >= MAX_PARTICIPANTS) {
      throw new ApiError(409, "This room is full.");
    }

    const token = secretToken();
    const { data, error } = await admin
      .from("participants")
      .insert({ room_id: room.id, name, token })
      .select("id")
      .single();
    if (error) throw new ApiError(500, error.message);

    await notifyRoom(room.code);
    return json({ code: room.code, token, participantId: data.id, name }, 201);
  });
}

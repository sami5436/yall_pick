import { ApiError, handle, json, readJson } from "@/lib/api";
import { admin } from "@/lib/supabase-admin";
import { roomCode, secretToken } from "@/lib/codes";
import { MAX_CHOICES, cleanChoiceLabel, cleanName, cleanTitle } from "@/lib/validate";

type CreateBody = { title?: string; name?: string; choices?: string[] };

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson<CreateBody>(request);
    const title = cleanTitle(body.title);
    const name = cleanName(body.name);
    const labels = (body.choices ?? [])
      .map(cleanChoiceLabel)
      .filter((label): label is string => Boolean(label))
      .slice(0, MAX_CHOICES);

    const room = await insertRoomWithUniqueCode(title);
    const token = secretToken();

    const { data: host, error: hostError } = await admin
      .from("participants")
      .insert({ room_id: room.id, name, token, is_host: true })
      .select("id")
      .single();

    if (hostError) throw new ApiError(500, hostError.message);

    if (labels.length > 0) {
      const { error } = await admin.from("choices").insert(
        labels.map((label, index) => ({
          room_id: room.id,
          label,
          added_by: host.id,
          position: index,
        })),
      );
      if (error) throw new ApiError(500, error.message);
    }

    return json({ code: room.code, token, participantId: host.id, name }, 201);
  });
}

/** Codes are short enough that a collision is possible, so retry a few times. */
async function insertRoomWithUniqueCode(title: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = roomCode();
    const { data, error } = await admin
      .from("rooms")
      .insert({ code, title })
      .select("id, code")
      .single();

    if (!error) return data as { id: string; code: string };
    if (error.code !== "23505") throw new ApiError(500, error.message);
  }
  throw new ApiError(500, "Could not find a free room code. Try again.");
}

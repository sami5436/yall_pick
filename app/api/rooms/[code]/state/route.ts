import { handle, json, requireParticipant } from "@/lib/api";
import { buildState } from "@/lib/state";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await params;
    const { room, me } = await requireParticipant(code, request);
    return json(await buildState(room, me));
  });
}

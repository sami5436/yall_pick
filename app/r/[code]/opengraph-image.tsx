import { ImageResponse } from "next/og";
import { admin } from "@/lib/supabase-admin";
import { normalizeCode } from "@/lib/codes";

export const alt = "A Y'all Pick room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const QUARTERS = ["#dd4f37", "#c98a10", "#0f9d76", "#4263eb"];

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { data } = await admin
    .from("rooms")
    .select("title")
    .eq("code", normalizeCode(code))
    .maybeSingle();

  const title = (data?.title as string | undefined) ?? "Come help us pick";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f1f2f4",
          padding: "80px 96px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", height: 14, width: 160, borderRadius: 999 }}>
            {QUARTERS.map((color) => (
              <div key={color} style={{ display: "flex", flex: 1, background: color }} />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#6b7280" }}>
            Y&apos;all Pick
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 34 ? 88 : 112,
            fontWeight: 800,
            color: "#16181d",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#6b7280" }}>
          Tap to vote. Nobody sees your picks until everybody is done.
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { TAGLINE } from "@/lib/site";

export const alt = "Y'all Pick";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const QUARTERS = ["#dd4f37", "#c98a10", "#0f9d76", "#4263eb"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f1f2f4",
          padding: "88px 96px",
        }}
      >
        <div style={{ display: "flex", height: 14, width: 320, borderRadius: 999 }}>
          {QUARTERS.map((color) => (
            <div key={color} style={{ display: "flex", flex: 1, background: color }} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 800,
            color: "#16181d",
            marginTop: 36,
          }}
        >
          Y&apos;all Pick
        </div>
        <div style={{ display: "flex", fontSize: 44, color: "#6b7280", marginTop: 20 }}>
          {TAGLINE}
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 56 }}>
          <Pill text="No" bg="#fce7e2" fg="#dd4f37" />
          <Pill text="Meh" bg="#fbf0d8" fg="#c98a10" />
          <Pill text="Yes" bg="#ddf3ec" fg="#0f9d76" />
        </div>
      </div>
    ),
    size,
  );
}

function Pill({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <div
      style={{
        display: "flex",
        background: bg,
        color: fg,
        fontSize: 44,
        fontWeight: 700,
        padding: "18px 48px",
        borderRadius: 999,
      }}
    >
      {text}
    </div>
  );
}

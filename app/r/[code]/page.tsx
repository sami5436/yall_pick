import type { Metadata } from "next";
import RoomClient from "@/components/RoomClient";
import { normalizeCode } from "@/lib/codes";
import { admin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * The room link is the thing people paste into a group chat, so the preview
 * shows what the group is deciding. Nothing past the title is public.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const { data } = await admin
    .from("rooms")
    .select("title")
    .eq("code", normalizeCode(code))
    .maybeSingle();

  const title = (data?.title as string | undefined) ?? "Come help us pick";
  const description = "Tap to vote. Nobody sees your picks until everybody is done.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Y'all Pick`,
      description,
      url: `/r/${normalizeCode(code)}`,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: false },
  };
}

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomClient code={normalizeCode(code)} />;
}

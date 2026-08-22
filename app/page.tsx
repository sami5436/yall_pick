import type { Metadata } from "next";
import Landing from "@/components/Landing";
import { TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Y'all Pick",
  description: TAGLINE,
  openGraph: { title: "Y'all Pick", description: TAGLINE, url: "/" },
};

export default function HomePage() {
  return <Landing />;
}

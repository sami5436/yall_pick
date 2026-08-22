"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

const noSubscribe = () => () => {};

/** Reads a browser only value without copying it into state on mount. */
function useBrowserValue<T extends string | boolean>(read: () => T, onServer: T): T {
  return useSyncExternalStore(noSubscribe, read, () => onServer);
}

export default function ShareBar({ code, title }: { code: string; title: string }) {
  const url = useBrowserValue(() => `${window.location.origin}/r/${code}`, "");
  const canShare = useBrowserValue(() => typeof navigator.share === "function", false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard is blocked outside a secure origin, so fall back to
      // selecting the link and letting the reader copy it themselves.
      const node = document.getElementById("yp-share-url");
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `Y'all Pick: ${title}`, text: "Help us pick.", url });
    } catch {
      // Dismissing the share sheet lands here. Nothing to do.
    }
  }

  return (
    <div className="rounded-3xl border border-accent/15 bg-accent-soft p-5">
      <p className="text-sm font-semibold text-accent">Send this to the group</p>
      <p
        id="yp-share-url"
        className="mt-2 truncate font-mono text-sm text-ink/80 select-all"
        title={url}
      >
        {url || "loading"}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Button onClick={copy} className="flex-1">
          {copied ? "Copied" : "Copy link"}
        </Button>
        {canShare ? (
          <Button variant="quiet" onClick={share}>
            Share
          </Button>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-muted">
        Or read out the code:{" "}
        <span className="font-mono text-base font-bold tracking-[0.25em] text-ink">{code}</span>
      </p>
    </div>
  );
}

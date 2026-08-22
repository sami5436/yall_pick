import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
  const looks = {
    primary: "bg-accent text-white shadow-sm hover:brightness-110",
    quiet: "bg-card text-ink border border-line hover:border-ink/25",
    ghost: "text-muted hover:text-ink",
  } as const;
  return <button className={`${base} ${looks[variant]} ${className}`} {...props} />;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-line bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-5 pt-8 pb-12">
      {children}
    </main>
  );
}

/** Four quarters, one per option, in the same colors the votes use. */
export function QuarterMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke="var(--color-card)" strokeWidth="3">
        <path d="M32 32 32 2A30 30 0 0 1 62 32Z" fill="var(--color-meh)" />
        <path d="M32 32 62 32A30 30 0 0 1 32 62Z" fill="var(--color-yes)" />
        <path d="M32 32 32 62A30 30 0 0 1 2 32Z" fill="var(--color-accent)" />
        <path d="M32 32 2 32A30 30 0 0 1 32 2Z" fill="var(--color-no)" />
      </g>
    </svg>
  );
}

export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${small ? "text-lg" : "text-2xl"}`}>
      <QuarterMark className={small ? "size-7" : "size-9"} />
      <span className="font-extrabold tracking-tight">Y&apos;all Pick</span>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-2xl bg-no-soft px-4 py-3 text-sm font-medium text-no">
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-ink outline-none placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15";

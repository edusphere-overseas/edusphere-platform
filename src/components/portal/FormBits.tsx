"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { btnPrimary } from "./ui";

export function SubmitButton({ children, className = btnPrimary, pending: pendingLabel }: { children: React.ReactNode; className?: string; pending?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-[#b42318]/20 bg-[#fdecec] px-4 py-3 text-sm font-medium text-[#8a1c13]">
      {message}
    </p>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
    onTurnstileReady?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile spam check. Adds a hidden "cf-turnstile-response" field to the form.
 * Shows nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. `resetKey` changes after each
 * attempt, because a token can only be used once.
 */
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    const el = box.current;
    const render = () => {
      if (!window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(el, { sitekey: SITE_KEY, theme: "light", size: "flexible", appearance: "interaction-only" });
    };
    if (window.turnstile) render();
    else {
      const prev = window.onTurnstileReady;
      window.onTurnstileReady = () => {
        prev?.();
        render();
      };
      if (!document.querySelector("script[data-turnstile]")) {
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady";
        s.async = true;
        s.dataset.turnstile = "1";
        document.head.appendChild(s);
      }
    }
    return () => {
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey !== undefined && widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-0" />;
}

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import LoadingDots from "@/components/loading-dots";

type Status = "loading" | "loaded" | "error";

export default function TermlyEmbed({ dataId }: { dataId: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    setStatus("loading");

    // Watch for Termly injecting content into the div
    const observer = new MutationObserver(() => {
      if (div.children.length > 0) {
        setStatus("loaded");
        observer.disconnect();
        clearTimeout(timeoutId);
      }
    });
    observer.observe(div, { childList: true, subtree: true });

    // Fallback: if nothing renders after 10s, surface an error
    const timeoutId = setTimeout(() => {
      if (div.children.length === 0) setStatus("error");
      observer.disconnect();
    }, 10000);

    // Trigger Termly's persistent MutationObserver by setting data-id.
    // The div is mounted without it so this attribute change is always detected,
    // regardless of whether the Termly script loaded before or after this effect.
    div.setAttribute("data-id", dataId);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      div.removeAttribute("data-id");
    };
  }, [dataId]);

  return (
    <>
      {/* @ts-expect-error Termly requires name attr on div; not in standard React types */}
      <div ref={divRef} name="termly-embed" />

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">
          Loading <LoadingDots />
        </div>
      )}

      {status === "error" && (
        <div className="py-20 text-center">
          <p className="text-sm text-gray-500">
            Document failed to load.{" "}
            <button
              onClick={() => window.location.reload()}
              className="font-bold text-[#551904] hover:underline"
            >
              Try reloading.
            </button>
          </p>
        </div>
      )}

      <Script
        src="https://app.termly.io/embed-policy.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}

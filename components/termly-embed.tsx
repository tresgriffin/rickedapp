"use client";

import Script from "next/script";

export default function TermlyEmbed({ dataId }: { dataId: string }) {
  return (
    <>
      {/* @ts-expect-error Termly requires name attr on div; not in standard React types */}
      <div name="termly-embed" data-id={dataId} />
      <Script
        src="https://app.termly.io/embed-policy.min.js"
        strategy="afterInteractive"
      />
    </>
  );
}

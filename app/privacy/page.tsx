import AppBar from "@/components/app-bar";
import TermlyEmbed from "@/components/termly-embed";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 px-5 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-8">
          Privacy Policy
        </h1>

        <TermlyEmbed dataId="7c604ea3-385b-455b-8ecd-fa415504c9c2" />
      </main>
    </div>
  );
}

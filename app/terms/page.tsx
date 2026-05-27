import AppBar from "@/components/app-bar";
import TermlyEmbed from "@/components/termly-embed";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fffbfa]">
      <AppBar plain />

      <main className="flex-1 px-5 py-8 max-w-3xl mx-auto w-full">
        <h1 className="font-[family-name:var(--font-abhaya-libre)] text-3xl font-bold text-[#0d3c54] mb-8">
          Terms of Service
        </h1>

        <TermlyEmbed dataId="1647b0ee-af7a-42ea-b2b9-0820d6f0922f" />
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "esuTABs — Open Source Knowledge, One Tab at a Time" },
      { name: "description", content: "Premium, offline-first Chrome New Tab focused on open source, Linux, Kubernetes, security, and digital sovereignty." },
    ],
  }),
  component: Index,
});

function download() {
  fetch("/esutabs.zip")
    .then((r) => { if (!r.ok) throw new Error(`Download failed: ${r.status}`); return r.blob(); })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "esutabs.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((err) => alert(err.message));
}

function Index() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full">
        <header className="flex items-center justify-between text-xs text-zinc-400 mb-16">
          <span>Chrome Extension · Manifest V3</span>
          <span>GPLv2+</span>
        </header>

        <h1 className="text-7xl font-bold tracking-tight leading-none">
          <span className="text-white">esu</span>
          <span className="text-white">TAB</span>
          <span className="text-[#30BA78]">s</span>
        </h1>
        <p className="mt-4 text-lg text-zinc-300">Open Source Knowledge, One Tab at a Time</p>
        <p className="mt-6 text-zinc-400 leading-relaxed">
          A premium, offline-first replacement for the Chrome New Tab page focused on Open Source,
          Linux, Kubernetes, Security, Digital Sovereignty, Software Architecture, and European Tech Sovereignty.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={download}
            className="rounded-xl bg-[#30BA78] text-black font-semibold px-6 py-3 hover:opacity-90 transition"
          >
            Download esutabs.zip
          </button>
          <a
            href="/esutabs.zip"
            className="rounded-xl border border-white/15 px-6 py-3 text-white/80 hover:bg-white/5 transition"
          >
            Direct link
          </a>
        </div>

        <section className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm uppercase tracking-widest text-zinc-400">Install (unpacked)</h2>
          <ol className="mt-4 space-y-2 text-zinc-200 list-decimal list-inside">
            <li>Unzip the downloaded file.</li>
            <li>Open <code className="text-[#30BA78]">chrome://extensions</code>.</li>
            <li>Enable <strong>Developer mode</strong> (top-right).</li>
            <li>Click <strong>Load unpacked</strong> and select the unzipped folder.</li>
            <li>Open a new tab.</li>
          </ol>
        </section>

        <footer className="mt-12 text-xs text-zinc-500 leading-relaxed">
          <p>Made with <span className="text-[#30BA78]">❤</span> by Bert Boerland.</p>
          <p>This Chrome Extension is not affiliated with, endorsed by, or sponsored by SUSE.</p>
        </footer>
      </div>
    </div>
  );
}

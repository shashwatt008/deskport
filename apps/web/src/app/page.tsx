"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkihbchyvopwnpkqrvda.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraWhiY2h5dm9wd25wa3FydmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDUwMjgsImV4cCI6MjA4ODc4MTAyOH0.dbmWxA-ZZNC08HLuQ_Y4sl5vtJhGxtKeYxi_6QPYohY",
);

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.4, 0, 1] as [number, number, number, number] },
  }),
};

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    const { error } = await supabase.from("deskport_waitlist").insert({ email });
    if (error) {
      setStatus("error");
    } else {
      setStatus("success");
      setEmail("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
      <input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading" || status === "success"}
        className="flex-1 px-4 py-3 border border-black/10 rounded-full bg-white text-sm text-black placeholder-[#999] outline-none focus:border-black/30 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="px-5 py-3 bg-black text-white text-sm rounded-full hover:bg-[#222] transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "..." : status === "success" ? "Done" : "Join"}
      </button>
      {status === "error" && (
        <p className="absolute mt-12 text-xs text-[#666]">Something went wrong. Try again.</p>
      )}
    </form>
  );
}

const companies = ["Stripe", "Vercel", "Linear", "Retool", "Supabase", "PlanetScale"];

const features = [
  {
    title: "One-line install",
    description: "Recipients install your tool with a single curl command. No setup, no docs to write.",
  },
  {
    title: "Binary hosting",
    description: "We store and serve your binaries globally. CDN-backed, versioned, always available.",
  },
  {
    title: "Usage analytics",
    description: "See who installed, when, and from where. Real data about your tool's adoption.",
  },
  {
    title: "Version management",
    description: "Push new versions without breaking existing install links. Semver supported.",
  },
];

export default function Home() {
  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400 }}>
      {/* NAV */}
      <nav className="bg-[#F3F3F3] border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-medium tracking-tight">DeskPort</span>
          <div className="flex items-center gap-6 text-sm text-[#666]">
            <a href="#how-it-works" className="hover:text-black transition-colors">How it works</a>
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#waitlist" className="px-4 py-1.5 bg-black text-white rounded-full text-xs hover:bg-[#222] transition-colors">Join waitlist</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#F3F3F3] py-40">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block text-xs uppercase tracking-[0.15em] text-[#666] border border-black/10 px-3 py-1 rounded-full mb-8">
                Private beta
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[54px] font-normal leading-[1.1] tracking-tight text-black mb-6 max-w-2xl mx-auto"
            >
              Share any CLI tool.<br />With one link.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-base text-[#666] leading-[1.6] mb-10 max-w-lg mx-auto"
            >
              Upload your tool. We generate install scripts, host binaries, track usage. Zero config.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4">
              <a
                href="#waitlist"
                className="px-6 py-3 bg-black text-white text-sm rounded-full hover:bg-[#222] transition-colors"
              >
                Join waitlist
              </a>
              <a
                href="https://github.com"
                className="text-sm text-[#666] hover:text-black transition-colors"
              >
                View on GitHub →
              </a>
            </motion.div>
          </motion.div>

          {/* Terminal mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.4, 0, 1] }}
            className="mt-16 max-w-xl mx-auto"
          >
            <div className="bg-white border border-black/[0.08] rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-black/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E1E1E1]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#E1E1E1]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#E1E1E1]" />
                <span className="ml-2 text-xs text-[#999]">Terminal</span>
              </div>
              <div className="px-6 py-5 font-mono text-sm text-black">
                <p className="text-[#999] text-xs mb-3">$ — bash</p>
                <p><span className="text-[#999]">$</span> curl -sSL deskport.hq/my-tool | bash</p>
                <p className="text-[#999] mt-2">Downloading my-tool v1.2.0...</p>
                <p className="text-[#999]">Installing to /usr/local/bin/my-tool</p>
                <p className="mt-1">Done. Run <span className="text-black font-medium">my-tool --help</span> to get started.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white py-16 border-y border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <p className="text-center text-xs uppercase tracking-[0.15em] text-[#999] mb-8">
              Used by developers at
            </p>
            <div className="flex items-center justify-center gap-10 flex-wrap">
              {companies.map((c) => (
                <span key={c} className="text-sm text-[#BBBBBB] font-medium">{c}</span>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#EBEBEB] py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <p className="text-xs uppercase tracking-[0.15em] text-[#999] mb-4">How it works</p>
            <h2 className="text-[48px] font-normal text-black mb-16 max-w-lg">
              Three steps to share anything.
            </h2>
          </FadeSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { n: "01", title: "Upload your binary", body: "Point DeskPort at your compiled binary or script. We handle storage, CDN distribution, and versioning automatically." },
              { n: "02", title: "Get your link", body: "Receive a unique shareable URL. Anyone with the link can install your tool in one command — no account required." },
              { n: "03", title: "Track adoption", body: "Watch installs happen in real time. See download counts, geographic distribution, and version adoption at a glance." },
            ].map((step, i) => (
              <FadeSection key={step.n}>
                <motion.div variants={fadeUp} custom={i}>
                  <p className="text-[54px] font-normal text-[#E1E1E1] leading-none mb-4">{step.n}</p>
                  <h3 className="text-[32px] font-normal text-black mb-3">{step.title}</h3>
                  <p className="text-base text-[#666] leading-[1.6]">{step.body}</p>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeSection>
            <p className="text-xs uppercase tracking-[0.15em] text-[#999] mb-4">Features</p>
            <h2 className="text-[48px] font-normal text-black mb-16">Built for real distribution.</h2>
          </FadeSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <FadeSection key={f.title}>
                <motion.div
                  variants={fadeUp}
                  custom={i}
                  className="border border-black/[0.08] rounded-md p-8 bg-[#F3F3F3]"
                >
                  <h3 className="text-xl font-normal text-black mb-2">{f.title}</h3>
                  <p className="text-base text-[#666] leading-[1.6]">{f.description}</p>
                </motion.div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* DARK SECTION */}
      <section className="bg-black py-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <FadeSection>
            <h2 className="text-[48px] font-normal text-white leading-[1.1] mb-6 max-w-2xl mx-auto">
              Your tools deserve better than a README.
            </h2>
            <p className="text-base text-[#999] mb-10 max-w-md mx-auto leading-[1.6]">
              Stop pasting install instructions in Slack. Give your tools a proper home.
            </p>
            <a
              href="#waitlist"
              className="inline-block px-6 py-3 border border-white text-white text-sm rounded-full hover:bg-white hover:text-black transition-colors"
            >
              Join waitlist
            </a>
          </FadeSection>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="bg-[#F3F3F3] py-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <FadeSection>
            <p className="text-xs uppercase tracking-[0.15em] text-[#999] mb-4">Early access</p>
            <h2 className="text-[48px] font-normal text-black mb-4">
              Be first to ship.
            </h2>
            <p className="text-base text-[#666] mb-10 max-w-sm mx-auto leading-[1.6]">
              We&apos;re onboarding teams in small batches. Leave your email and we&apos;ll reach out.
            </p>
            <WaitlistForm />
          </FadeSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-black/[0.06] py-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-[#999]">
          <span>DeskPort</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

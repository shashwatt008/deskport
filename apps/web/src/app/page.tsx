"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  Terminal,
  Shield,
  Users,
  Zap,
  Monitor,
  Lock,
  Eye,
  ArrowRight,
  Globe,
  Clock,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dkihbchyvopwnpkqrvda.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraWhiY2h5dm9wd25wa3FydmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDUwMjgsImV4cCI6MjA4ODc4MTAyOH0.dbmWxA-ZZNC08HLuQ_Y4sl5vtJhGxtKeYxi_6QPYohY",
);

// ── Animated counter ──────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ── Terminal typing animation ─────────────────────────────────────
function TerminalDemo() {
  const lines = [
    { prompt: "you@server", cmd: "deskport share my-tool --team engineering", delay: 0 },
    { output: "  Connecting to DeskPort relay...", delay: 900 },
    { output: "  Agent online  ●  wss://relay.deskport.dev", delay: 1600 },
    { output: "", delay: 2000 },
    { prompt: "alice@browser", cmd: "# Zero install — opens in browser", delay: 2400 },
    { output: "  Session started  ●  claude-code, aws-cli available", delay: 3200 },
    { prompt: "alice@browser", cmd: 'claude "fix the auth middleware"', delay: 3800 },
    { output: "  ● Claude Code running... (sandboxed to /app/src)", delay: 4600 },
    { output: "  ✓ Fixed auth guard — 3 files changed", delay: 5800 },
  ];

  const [visibleLines, setVisibleLines] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl border shadow-2xl"
      style={{
        background: "#0D0D0D",
        borderColor: "rgba(0,255,65,0.15)",
        boxShadow: "0 0 60px rgba(0,255,65,0.05), 0 25px 50px rgba(0,0,0,0.6)",
      }}
    >
      {/* Glow top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #00FF41, transparent)" }}
      />

      {/* Title bar */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span
          className="ml-2 text-xs"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.3)" }}
        >
          deskport — terminal
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00FF41] animate-pulse" />
          <span className="text-xs" style={{ color: "#00FF41", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
            live
          </span>
        </div>
      </div>

      {/* Lines */}
      <div className="p-5 min-h-[220px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: "1.7" }}>
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {"prompt" in line && line.prompt ? (
              <div>
                <span style={{ color: "#00FF41" }}>{line.prompt}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>:~$ </span>
                <span style={{ color: "#ffffff" }}>{line.cmd}</span>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.45)" }}>{line.output}</div>
            )}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <span
            className="inline-block h-4 w-2 animate-pulse"
            style={{ background: "#00FF41", opacity: 0.7 }}
          />
        )}
      </div>
    </div>
  );
}

// ── Feature card with scroll-triggered fade-up ────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-xl border p-6 transition-all duration-300 cursor-default"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
      whileHover={{
        borderColor: "rgba(0,255,65,0.2)",
        background: "rgba(0,255,65,0.03)",
        y: -2,
      }}
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        style={{ background: "rgba(0,255,65,0.08)", color: "#00FF41" }}
      >
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
        {desc}
      </p>
    </motion.div>
  );
}

// ── Waitlist form with Supabase ───────────────────────────────────
function WaitlistForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const { error: sbError } = await supabase
        .from("deskport_waitlist")
        .insert({ email: email.toLowerCase().trim() });
      if (sbError && sbError.code !== "23505") {
        setError("Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm ${className}`}
        style={{ borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.08)", color: "#00FF41" }}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>You&apos;re on the list. We&apos;ll reach out soon.</span>
      </motion.div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 flex-1 rounded-xl border px-4 text-sm text-white outline-none transition-all"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(0,255,65,0.4)";
            e.target.style.boxShadow = "0 0 0 3px rgba(0,255,65,0.08)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.1)";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #00FF41, #00D4FF)",
            color: "#0A0A0A",
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: "0 0 24px rgba(0,255,65,0.2)",
          }}
        >
          {loading ? "Joining..." : "Join Waitlist"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "#ff6b6b", fontFamily: "'JetBrains Mono', monospace" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── How it works step ─────────────────────────────────────────────
function HowItWorksStep({
  step,
  icon,
  title,
  desc,
  code,
  delay,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
  code?: string | null;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center text-center px-6 py-8"
    >
      {/* Step number badge */}
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(0,255,65,0.08)",
          border: "1px solid rgba(0,255,65,0.2)",
          color: "#00FF41",
        }}
      >
        {icon}
      </div>
      <div
        className="mb-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "rgba(0,255,65,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        Step {step}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
        {desc}
      </p>
      {code && (
        <code
          className="mt-3 rounded-md px-3 py-1.5 text-xs"
          style={{
            background: "rgba(0,255,65,0.08)",
            color: "#00FF41",
            fontFamily: "'JetBrains Mono', monospace",
            border: "1px solid rgba(0,255,65,0.15)",
          }}
        >
          {code}
        </code>
      )}
    </motion.div>
  );
}

// ── Mesh blob background ──────────────────────────────────────────
function MeshBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          top: "-20%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,255,65,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "10%",
          right: "-15%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "20%",
          left: "20%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,255,65,0.03) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}

// ── Stat item ────────────────────────────────────────────────────
function StatItem({
  value,
  suffix,
  label,
  icon,
  delay,
}: {
  value: number | string;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="text-center"
    >
      <div className="mb-1 flex items-center justify-center gap-1.5" style={{ color: "rgba(0,255,65,0.5)" }}>
        {icon}
      </div>
      <div
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#ffffff" }}
      >
        {typeof value === "number" && value % 1 === 0 && value > 0 ? (
          <AnimatedNumber target={value} suffix={suffix} />
        ) : value === 0 ? (
          <>Zero{suffix}</>
        ) : (
          <>{value}{suffix}</>
        )}
      </div>
      <div className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Sandboxed Sessions",
      desc: "Restrict directories, tools, and commands per session template. No one goes rogue.",
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Live Monitoring",
      desc: "Watch any session in real-time. Read-only spectator mode for admins.",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Encrypted Tunnel",
      desc: "WSS tunnel with API-key auth. Terminal data never touches disk.",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Audit Logs",
      desc: "Every session, login, and config change logged with timestamps and user IDs.",
    },
    {
      icon: <Terminal className="h-5 w-5" />,
      title: "Session Recording",
      desc: "Asciicast v2 recordings for compliance and playback.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Management",
      desc: "Invite members, assign admin/member roles, manage seats.",
    },
  ];

  const steps = [
    {
      icon: <Terminal className="h-6 w-6" />,
      title: "Install Agent",
      desc: "One command on your server. Connects via secure WebSocket tunnel.",
      code: "npx deskport start",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Invite Team",
      desc: "Add members, assign roles. Control who accesses what.",
      code: null,
    },
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Share via Browser",
      desc: "Team opens a link — full terminal in the browser. Zero install.",
      code: null,
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: ["3 seats", "1 agent", "5 sessions/day", "Community support"],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      features: [
        "10 seats",
        "Unlimited agents",
        "Unlimited sessions",
        "Session recording",
        "Audit logs",
        "Priority support",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      features: [
        "50 seats",
        "Unlimited everything",
        "SSO / SAML",
        "Custom templates",
        "Dedicated support",
        "SLA guarantee",
      ],
      cta: "Contact Us",
      highlighted: false,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#0A0A0A" }}>
      {/* Grain overlay */}
      <div className="grain-overlay pointer-events-none fixed inset-0 z-[1]" />

      {/* Mesh blobs */}
      <MeshBlobs />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 z-50 w-full transition-all duration-300"
        style={{
          background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "rgba(0,255,65,0.1)", color: "#00FF41", border: "1px solid rgba(0,255,65,0.2)" }}
            >
              <Terminal className="h-4 w-4" />
            </div>
            <span
              className="text-lg font-bold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              DeskPort
            </span>
          </div>
          <a
            href="#waitlist"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #00FF41, #00D4FF)",
              color: "#0A0A0A",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: "0 0 20px rgba(0,255,65,0.15)",
            }}
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-6 pb-24 pt-36 md:pt-44">
        {/* Dotted grid */}
        <div
          className="dotted-grid pointer-events-none absolute inset-0"
          style={{ opacity: 0.5, maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)" }}
        />

        <div className="relative mx-auto max-w-6xl z-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
                style={{
                  background: "rgba(0,255,65,0.06)",
                  border: "1px solid rgba(0,255,65,0.2)",
                  color: "#00FF41",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                Coming Soon — Join the Waitlist
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className="gradient-text">Share CLI tools</span>
                <br />
                <span className="text-white">with your team.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 max-w-lg text-lg leading-relaxed"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                One agent on your server. Your team gets browser-based terminal
                access to Claude Code, AWS CLI, kubectl — any CLI tool.
                Zero install, full control.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 max-w-md"
              >
                <p className="mb-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
                  // be first to get access:
                </p>
                <WaitlistForm />
              </motion.div>

              {/* Trust bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mt-10 flex items-center gap-6 text-xs"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> End-to-end encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> SOC 2 ready
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Self-hostable
                </span>
              </motion.div>
            </div>

            {/* Right — Terminal Demo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div
                className="absolute -inset-8 rounded-2xl"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(0,255,65,0.06) 0%, transparent 70%)",
                }}
              />
              <TerminalDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section
        className="border-y"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
          <StatItem value={50} suffix="ms" label="Avg latency" icon={<Clock className="h-4 w-4" />} delay={0} />
          <StatItem value={256} suffix="-bit" label="AES encryption" icon={<Lock className="h-4 w-4" />} delay={0.1} />
          <StatItem value={99.9} suffix="%" label="Uptime SLA" icon={<BarChart3 className="h-4 w-4" />} delay={0.2} />
          <StatItem value={0} label="Install for team" icon={<Zap className="h-4 w-4" />} delay={0.3} />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <div
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,255,65,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              // how it works
            </div>
            <h2
              className="text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Up and running in 3 steps
            </h2>
          </motion.div>
          <div className="grid gap-0 md:grid-cols-3">
            {steps.map((step, i) => (
              <HowItWorksStep
                key={i}
                step={i + 1}
                icon={step.icon}
                title={step.title}
                desc={step.desc}
                code={step.code}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────── */}
      <section
        className="border-y px-6 py-24"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <div
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,255,65,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              // features
            </div>
            <h2
              className="text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Everything you need for secure CLI sharing
            </h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                delay={i * 0.07}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <div
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,255,65,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              // use cases
            </div>
            <h2
              className="text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Built for teams that share powerful tools
            </h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: "🤖",
                title: "Share AI Coding Assistants",
                desc: "One Claude Code license, entire team gets browser access. Admin watches everything.",
                tags: ["Claude Code", "Cursor", "Copilot CLI"],
              },
              {
                icon: "☁️",
                title: "Cloud Infrastructure Access",
                desc: "Grant kubectl and AWS CLI access without sharing credentials or SSH keys.",
                tags: ["AWS CLI", "kubectl", "terraform"],
              },
              {
                icon: "🎓",
                title: "Training & Onboarding",
                desc: "New hires get pre-configured terminals. Instructors monitor in real-time.",
                tags: ["Bootcamps", "Workshops", "Pair programming"],
              },
              {
                icon: "🔒",
                title: "Compliance & Audit",
                desc: "Every command recorded. Session templates enforce least-privilege. SOC 2 ready.",
                tags: ["HIPAA", "SOC 2", "ISO 27001"],
              },
            ].map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border p-6"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <div className="mb-3 text-3xl">{uc.icon}</div>
                <h3
                  className="mb-2 text-lg font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {uc.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {uc.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {uc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2.5 py-1 text-xs"
                      style={{
                        background: "rgba(0,255,65,0.06)",
                        color: "rgba(0,255,65,0.7)",
                        border: "1px solid rgba(0,255,65,0.12)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section
        className="border-y px-6 py-24"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-16"
          >
            <div
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,255,65,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              // pricing
            </div>
            <h2
              className="mb-4 text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Start free, scale when ready
            </h2>
            <p className="mx-auto max-w-lg text-base" style={{ color: "rgba(255,255,255,0.4)" }}>
              No credit card required. Upgrade anytime.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl border p-6"
                style={
                  plan.highlighted
                    ? {
                        background: "rgba(0,255,65,0.04)",
                        borderColor: "rgba(0,255,65,0.25)",
                        boxShadow: "0 0 40px rgba(0,255,65,0.08), inset 0 1px 0 rgba(0,255,65,0.1)",
                      }
                    : {
                        background: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.07)",
                      }
                }
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #00FF41, #00D4FF)",
                      color: "#0A0A0A",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <h3
                  className="text-lg font-semibold text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {plan.name}
                </h3>
                <div className="mt-3 mb-6">
                  <span
                    className="text-4xl font-bold text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "rgba(0,255,65,0.6)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className="block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-all"
                  style={
                    plan.highlighted
                      ? {
                          background: "linear-gradient(135deg, #00FF41, #00D4FF)",
                          color: "#0A0A0A",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          color: "rgba(255,255,255,0.7)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }
                  }
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Waitlist ───────────────────────────────────── */}
      <section id="waitlist" className="px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl rounded-2xl border p-14 text-center relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(0,255,65,0.15)",
            boxShadow: "0 0 80px rgba(0,255,65,0.05)",
          }}
        >
          {/* Top glow line */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,65,0.5), transparent)" }}
          />

          <div
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "rgba(0,255,65,0.6)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            // join waitlist
          </div>
          <h2
            className="text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Ready to share your CLI tools?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
            We&apos;re putting the finishing touches on DeskPort. Join the waitlist and we&apos;ll notify you the moment it&apos;s live.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm />
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-8"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Terminal className="h-4 w-4" style={{ color: "#00FF41" }} />
            DeskPort
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
            &copy; {new Date().getFullYear()} DeskPort. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

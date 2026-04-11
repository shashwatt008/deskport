"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
import {
  Terminal,
  Shield,
  Users,
  Zap,
  Monitor,
  Lock,
  Eye,
  ArrowRight,
  ChevronDown,
  Globe,
  Clock,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

// ── Animated counter ────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ── Terminal typing animation ───────────────────────────────────
function TerminalDemo() {
  const lines = [
    { prompt: "admin@server", cmd: "deskport start --agent prod-server", delay: 0 },
    { output: "Agent connected  ●  wss://api.deskport.dev/tunnel", delay: 1200 },
    { output: "Waiting for sessions...", delay: 1800 },
    { output: "", delay: 2200 },
    { prompt: "teammate@browser", cmd: "# Zero-install — opens in browser", delay: 2600 },
    { output: "Session started  ●  claude-code, aws-cli available", delay: 3400 },
    { prompt: "teammate@browser", cmd: "claude \"fix the auth middleware\"", delay: 4000 },
    { output: "● Claude Code running... (sandboxed to /app/src)", delay: 4800 },
    { output: "✓ Fixed auth guard — 3 files changed", delay: 6000 },
  ];

  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-[oklch(0.12_0.015_260)] shadow-2xl shadow-primary/5">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 text-xs text-muted-foreground/70">DeskPort Terminal</span>
      </div>
      {/* Lines */}
      <div className="p-4 font-mono text-[13px] leading-6">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className="animate-[fadeSlideIn_0.3s_ease-out]"
          >
            {"prompt" in line && line.prompt ? (
              <div>
                <span className="text-emerald-400">{line.prompt}</span>
                <span className="text-muted-foreground">:</span>
                <span className="text-primary">~</span>
                <span className="text-muted-foreground">$ </span>
                <span className="text-foreground">{line.cmd}</span>
              </div>
            ) : (
              <div className="text-muted-foreground/80">{line.output}</div>
            )}
          </div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block h-4 w-2 animate-pulse bg-primary/70" />
        )}
      </div>
    </div>
  );
}

// ── Architecture SVG infographic ────────────────────────────────
function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 800 320" className="w-full" xmlns="http://www.w3.org/2000/svg">
      {/* Defs */}
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.18 250)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="oklch(0.62 0.18 250)" stopOpacity="0" />
        </linearGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Connection lines */}
      <path d="M200,160 C300,160 300,160 380,160" stroke="oklch(0.62 0.18 250)" strokeWidth="2" strokeDasharray="6,4" fill="none" opacity="0.5">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M520,160 C600,160 600,160 620,160" stroke="oklch(0.62 0.18 250)" strokeWidth="2" strokeDasharray="6,4" fill="none" opacity="0.5">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
      </path>
      {/* Browser to API top */}
      <path d="M700,130 C700,80 700,80 450,60" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" strokeDasharray="4,4" fill="none" opacity="0.4">
        <animate attributeName="stroke-dashoffset" from="0" to="16" dur="3s" repeatCount="indefinite" />
      </path>
      {/* Browser to API bottom */}
      <path d="M700,190 C700,250 700,250 450,270" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" strokeDasharray="4,4" fill="none" opacity="0.4">
        <animate attributeName="stroke-dashoffset" from="0" to="16" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Host Machine */}
      <rect x="40" y="100" width="160" height="120" rx="12" fill="oklch(0.18 0.015 260)" stroke="oklch(0.32 0.02 260)" strokeWidth="1.5" />
      <rect x="40" y="100" width="160" height="120" rx="12" fill="url(#glow)" />
      <text x="120" y="135" textAnchor="middle" fill="oklch(0.95 0.01 260)" fontSize="13" fontWeight="600">Host Machine</text>
      <text x="120" y="155" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="11">deskport agent</text>
      <rect x="60" y="168" width="50" height="22" rx="4" fill="oklch(0.25 0.02 260)" />
      <text x="85" y="183" textAnchor="middle" fill="oklch(0.7 0.015 260)" fontSize="9">tmux</text>
      <rect x="120" y="168" width="60" height="22" rx="4" fill="oklch(0.25 0.02 260)" />
      <text x="150" y="183" textAnchor="middle" fill="oklch(0.7 0.015 260)" fontSize="9">node-pty</text>

      {/* API Server */}
      <rect x="380" y="80" width="140" height="160" rx="12" fill="oklch(0.18 0.015 260)" stroke="oklch(0.62 0.18 250)" strokeWidth="1.5" />
      <circle cx="450" cy="120" r="20" fill="oklch(0.62 0.18 250)" opacity="0.15" />
      <text x="450" y="125" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="16">⚡</text>
      <text x="450" y="155" textAnchor="middle" fill="oklch(0.95 0.01 260)" fontSize="13" fontWeight="600">DeskPort API</text>
      <text x="450" y="175" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="10">WebSocket relay</text>
      <text x="450" y="190" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="10">Auth + ACL</text>
      <text x="450" y="205" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="10">Audit logging</text>
      <text x="450" y="220" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="10">Recording</text>

      {/* Browser terminals */}
      <rect x="620" y="70" width="150" height="50" rx="8" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" />
      <text x="695" y="100" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="11" fontWeight="500">👤 Team Member A</text>

      <rect x="620" y="135" width="150" height="50" rx="8" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" />
      <text x="695" y="165" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="11" fontWeight="500">👤 Team Member B</text>

      <rect x="620" y="200" width="150" height="50" rx="8" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.2 25)" strokeWidth="1.5" />
      <text x="695" y="225" textAnchor="middle" fill="oklch(0.55 0.2 25)" fontSize="11" fontWeight="500">👁 Admin Monitor</text>

      {/* Labels */}
      <text x="120" y="80" textAnchor="middle" fill="oklch(0.5 0.015 260)" fontSize="10" fontWeight="500" letterSpacing="1">YOUR SERVER</text>
      <text x="450" y="62" textAnchor="middle" fill="oklch(0.5 0.015 260)" fontSize="10" fontWeight="500" letterSpacing="1">CLOUD</text>
      <text x="695" y="52" textAnchor="middle" fill="oklch(0.5 0.015 260)" fontSize="10" fontWeight="500" letterSpacing="1">BROWSER (ZERO INSTALL)</text>

      {/* Data flow labels */}
      <text x="290" y="148" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="9" opacity="0.7">WSS tunnel</text>
      <text x="575" y="148" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="9" opacity="0.7">xterm.js</text>
    </svg>
  );
}

// ── Flow infographic ────────────────────────────────────────────
function HowItWorksFlow() {
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
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Monitor & Audit",
      desc: "Watch sessions live. Full audit trail. Session recordings.",
      code: null,
    },
  ];

  return (
    <div className="grid gap-0 md:grid-cols-4">
      {steps.map((step, i) => (
        <div key={i} className="relative flex flex-col items-center text-center px-6 py-8">
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="absolute right-0 top-[52px] hidden h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
          )}
          {/* Step number */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            {step.icon}
          </div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
            Step {i + 1}
          </div>
          <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
          {step.code && (
            <code className="mt-3 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
              {step.code}
            </code>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Waitlist form ───────────────────────────────────────────────
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
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-400 ${className}`}>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        You're on the list! We'll reach out soon.
      </div>
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
          className="h-12 flex-1 rounded-xl border border-border/50 bg-card/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Waitlist"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.62 0.18 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.18 250) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-border/50 bg-background/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">DeskPort</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#waitlist"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-6 pb-16 pt-32 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Zap className="h-3.5 w-3.5" />
                Coming Soon — Join the Waitlist
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                Share CLI tools
                <br />
                <span className="bg-gradient-to-r from-primary via-[oklch(0.65_0.2_280)] to-primary bg-clip-text text-transparent">
                  with your team
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                One agent on your server. Your team gets browser-based terminal
                access to Claude Code, AWS CLI, kubectl — any CLI tool.
                Zero install, full control.
              </p>
              <div className="mt-8 max-w-md">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Join the waitlist — be first to get access:
                </p>
                <WaitlistForm />
              </div>
              {/* Trust bar */}
              <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> End-to-end encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> SOC 2 ready
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Self-hostable
                </span>
              </div>
            </div>
            {/* Right — Terminal Demo */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl" />
              <TerminalDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section className="border-y border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {[
            { value: 50, suffix: "ms", label: "Avg latency", icon: <Clock className="h-4 w-4" /> },
            { value: 256, suffix: "-bit", label: "AES encryption", icon: <Lock className="h-4 w-4" /> },
            { value: 99.9, suffix: "%", label: "Uptime SLA", icon: <BarChart3 className="h-4 w-4" /> },
            { value: 0, suffix: " install", label: "For team members", icon: <Zap className="h-4 w-4" /> },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1.5 text-primary/60">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {stat.value === 0 ? (
                  "Zero"
                ) : typeof stat.value === "number" && stat.value % 1 === 0 ? (
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                ) : (
                  <>
                    {stat.value}
                    {stat.suffix}
                  </>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture Diagram ─────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
            Architecture
          </div>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Simple, secure architecture
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Your CLI tools stay on your server. DeskPort relays terminal I/O
            through an encrypted WebSocket tunnel. Nothing is stored — just relayed.
          </p>
          <ArchitectureDiagram />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="border-y border-border/30 bg-card/20 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
            How it works
          </div>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Up and running in 4 steps
          </h2>
          <HowItWorksFlow />
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
            Features
          </div>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Everything you need for secure CLI sharing
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
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
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/30 hover:bg-card"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────── */}
      <section className="border-y border-border/30 bg-card/20 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
            Use Cases
          </div>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Built for teams that share powerful tools
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                emoji: "🤖",
                title: "Share AI Coding Assistants",
                desc: "One Claude Code or Cursor license, entire team gets browser access. Admin watches everything.",
                tags: ["Claude Code", "Cursor", "Copilot CLI"],
              },
              {
                emoji: "☁️",
                title: "Cloud Infrastructure Access",
                desc: "Grant kubectl and AWS CLI access without sharing credentials or SSH keys.",
                tags: ["AWS CLI", "kubectl", "terraform"],
              },
              {
                emoji: "🎓",
                title: "Training & Onboarding",
                desc: "New hires get pre-configured terminals. Instructors monitor in real-time.",
                tags: ["Bootcamps", "Workshops", "Pair programming"],
              },
              {
                emoji: "🔒",
                title: "Compliance & Audit",
                desc: "Every command recorded. Session templates enforce least-privilege. SOC 2 ready.",
                tags: ["HIPAA", "SOC 2", "ISO 27001"],
              },
            ].map((uc, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card/50 p-6"
              >
                <div className="mb-3 text-3xl">{uc.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold">{uc.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{uc.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {uc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-primary/10 px-2.5 py-1 text-xs text-primary/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
            Pricing
          </div>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            Start free, scale when ready
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
            No credit card required. Upgrade anytime via PayPal.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: ["3 seats", "1 agent", "5 sessions/day", "Community support"],
                cta: "Get Started",
                href: "#waitlist",
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
                href: "#waitlist",
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
                href: "#waitlist",
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-6 transition-all ${
                  plan.highlighted
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/50 bg-card/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary/70" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-all ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      : "border border-border bg-card text-foreground hover:border-primary/30"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section id="waitlist" className="px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to share your CLI tools?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            We're putting the finishing touches on DeskPort. Join the waitlist and we'll notify you the moment it's live.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border/30 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Terminal className="h-4 w-4" />
            DeskPort
          </div>
          <div className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} DeskPort. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

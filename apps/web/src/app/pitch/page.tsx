"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Zap,
  Monitor,
  Lock,
  Eye,
  BarChart3,
  Globe,
  ArrowRight,
  DollarSign,
} from "lucide-react";

const slides = [
  // 0 — Title
  {
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Terminal className="h-10 w-10" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">DeskPort</h1>
        <p className="mt-4 text-xl text-muted-foreground md:text-2xl">
          Share CLI tools with your team — securely, instantly.
        </p>
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground/70">
          <span className="rounded-full border border-border px-3 py-1">Enterprise SaaS</span>
          <span className="rounded-full border border-border px-3 py-1">Developer Tools</span>
          <span className="rounded-full border border-border px-3 py-1">Security</span>
        </div>
      </div>
    ),
  },
  // 1 — Problem
  {
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-destructive">
          The Problem
        </div>
        <h2 className="mb-8 text-4xl font-bold tracking-tight md:text-5xl">
          CLI tool access is broken
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { icon: "💸", title: "$200+/seat/month", desc: "AI coding tools charge per seat. Teams of 10 pay $2,000+/mo for Claude Code, Cursor, etc." },
            { icon: "🔑", title: "Credential sharing", desc: "Teams share SSH keys, API tokens, and passwords over Slack. No audit trail." },
            { icon: "⏱️", title: "Setup friction", desc: "Every new hire needs local install, env config, VPN setup. Days wasted." },
            { icon: "🙈", title: "Zero visibility", desc: "Managers have no idea what commands are being run or by whom." },
          ].map((p, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-6">
              <div className="mb-3 text-3xl">{p.icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 2 — Solution
  {
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          The Solution
        </div>
        <h2 className="mb-8 text-4xl font-bold tracking-tight md:text-5xl">
          One license, whole team
        </h2>
        <div className="relative mx-auto w-full max-w-3xl">
          <svg viewBox="0 0 700 200" className="w-full" xmlns="http://www.w3.org/2000/svg">
            {/* Host */}
            <rect x="20" y="60" width="160" height="80" rx="12" fill="oklch(0.18 0.015 260)" stroke="oklch(0.32 0.02 260)" strokeWidth="1.5" />
            <text x="100" y="95" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="13" fontWeight="600">Your Server</text>
            <text x="100" y="115" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="11">1 CLI license</text>

            {/* Arrow */}
            <path d="M190,100 L310,100" stroke="oklch(0.62 0.18 250)" strokeWidth="2" strokeDasharray="6,4" fill="none" markerEnd="url(#arrowhead)">
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
            </path>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.62 0.18 250)" />
              </marker>
            </defs>
            <text x="250" y="88" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="10">Encrypted</text>

            {/* DeskPort */}
            <rect x="320" y="50" width="120" height="100" rx="12" fill="oklch(0.18 0.015 260)" stroke="oklch(0.62 0.18 250)" strokeWidth="2" />
            <text x="380" y="95" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="14" fontWeight="700">DeskPort</text>
            <text x="380" y="115" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="10">relay + auth</text>

            {/* Arrows to users */}
            <path d="M450,80 L530,50" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" fill="none" />
            <path d="M450,100 L530,100" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" fill="none" />
            <path d="M450,120 L530,150" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" fill="none" />

            {/* Team */}
            <rect x="540" y="25" width="140" height="40" rx="8" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" />
            <text x="610" y="50" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="12">Dev 1 (browser)</text>

            <rect x="540" y="80" width="140" height="40" rx="8" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" />
            <text x="610" y="105" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="12">Dev 2 (browser)</text>

            <rect x="540" y="135" width="140" height="40" rx="8" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1.5" />
            <text x="610" y="160" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="12">Dev 3 (browser)</text>
          </svg>
        </div>
        <p className="mt-6 text-center text-lg text-muted-foreground">
          Install one agent. Your entire team gets browser-based terminal access. <strong className="text-foreground">Zero install for them.</strong>
        </p>
      </div>
    ),
  },
  // 3 — How it works
  {
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          How It Works
        </div>
        <h2 className="mb-10 text-4xl font-bold tracking-tight">4 steps to go live</h2>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { step: "01", icon: <Terminal className="h-6 w-6" />, title: "Install Agent", desc: "npx deskport start on your server" },
            { step: "02", icon: <Users className="h-6 w-6" />, title: "Add Team", desc: "Invite via email, assign roles" },
            { step: "03", icon: <Shield className="h-6 w-6" />, title: "Set Policies", desc: "Templates with dir/tool restrictions" },
            { step: "04", icon: <Monitor className="h-6 w-6" />, title: "Share & Monitor", desc: "Team uses browser, you watch live" },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border/50 bg-card/50 p-6 text-center">
              <div className="mb-3 text-3xl font-bold text-primary/30">{s.step}</div>
              <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {s.icon}
              </div>
              <h3 className="mb-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 4 — Features
  {
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Key Features
        </div>
        <h2 className="mb-8 text-4xl font-bold tracking-tight">Enterprise-grade security</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <Lock className="h-5 w-5" />, title: "E2E Encryption", desc: "256-bit AES WebSocket tunnel" },
            { icon: <Shield className="h-5 w-5" />, title: "Sandboxed", desc: "Restrict dirs, tools, commands" },
            { icon: <Eye className="h-5 w-5" />, title: "Live Monitor", desc: "Watch any session real-time" },
            { icon: <BarChart3 className="h-5 w-5" />, title: "Audit Logs", desc: "Every action recorded" },
            { icon: <Terminal className="h-5 w-5" />, title: "Recording", desc: "Asciicast v2 playback" },
            { icon: <Globe className="h-5 w-5" />, title: "Self-hostable", desc: "On-prem or cloud, your choice" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 5 — Market
  {
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Market Opportunity
        </div>
        <h2 className="mb-10 text-4xl font-bold tracking-tight">Massive and growing</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { value: "$45B", label: "Developer Tools market by 2028", color: "text-primary" },
            { value: "27M+", label: "Professional developers worldwide", color: "text-emerald-400" },
            { value: "73%", label: "Teams using 3+ CLI tools daily", color: "text-amber-400" },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div className={`text-5xl font-extrabold ${m.color}`}>{m.value}</div>
              <p className="mt-2 text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 grid w-full max-w-2xl gap-4 md:grid-cols-2">
          {[
            "AI coding assistants ($200+/seat/mo)",
            "Cloud infra teams (kubectl, terraform)",
            "Training bootcamps & workshops",
            "Compliance-heavy industries (HIPAA, SOC 2)",
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-sm">
              <Zap className="h-4 w-4 shrink-0 text-primary" />
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 6 — Pricing
  {
    render: () => (
      <div className="flex h-full flex-col justify-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Pricing
        </div>
        <h2 className="mb-10 text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Free", price: "$0", desc: "3 seats, 1 agent", features: ["5 sessions/day", "Community support"] },
            { name: "Pro", price: "$29/mo", desc: "10 seats, unlimited", features: ["Session recording", "Audit logs", "Priority support"], popular: true },
            { name: "Enterprise", price: "$99/mo", desc: "50 seats, SSO", features: ["SAML/SSO", "SLA guarantee", "Dedicated support"] },
          ].map((p) => (
            <div key={p.name} className={`rounded-xl border p-6 ${p.popular ? "border-primary bg-primary/5" : "border-border/50 bg-card/50"}`}>
              {p.popular && <div className="mb-3 text-xs font-semibold text-primary">MOST POPULAR</div>}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <div className="mt-2 text-3xl font-extrabold">{p.price}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-3 w-3 text-primary" />{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  // 7 — CTA
  {
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Terminal className="h-10 w-10" />
        </div>
        <h2 className="text-5xl font-extrabold tracking-tight md:text-6xl">Let&apos;s build this together</h2>
        <p className="mx-auto mt-6 max-w-md text-xl text-muted-foreground">
          DeskPort is live and free to start. Your team is one command away.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground/60">
          deskport-app.web.app
        </p>
      </div>
    ),
  },
];

export default function PitchDeckPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.62 0.18 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.18 250) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Slide content */}
      <div className="h-full px-8 py-12 md:px-16 md:py-16">
        {slides[current].render()}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <button
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          disabled={current === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-accent disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((c) => Math.min(c + 1, slides.length - 1))}
          disabled={current === slides.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:bg-accent disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-6 right-6 text-xs text-muted-foreground/50">
        {current + 1} / {slides.length}
      </div>

      {/* DeskPort logo */}
      <div className="fixed top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground/50">
        <Terminal className="h-4 w-4" />
        DeskPort
      </div>
    </div>
  );
}

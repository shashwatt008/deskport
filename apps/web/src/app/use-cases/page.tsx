"use client";

import Link from "next/link";
import {
  Terminal,
  ArrowRight,
  Bot,
  Cloud,
  GraduationCap,
  ShieldCheck,
  Code2,
  Server,
  Users,
  Lock,
  Eye,
  BarChart3,
} from "lucide-react";

const useCases = [
  {
    id: "ai-assistants",
    icon: <Bot className="h-8 w-8" />,
    title: "Share AI Coding Assistants",
    tagline: "One license. Entire team. Full visibility.",
    color: "from-violet-500/20 to-primary/20",
    borderColor: "border-violet-500/30",
    iconBg: "bg-violet-500/15 text-violet-400",
    problem:
      "AI coding tools like Claude Code, Cursor, and Copilot charge $20-200 per seat per month. A team of 10 costs $2,000+/mo. Most seats sit idle 80% of the time.",
    solution:
      "Install DeskPort agent on a server with one Claude Code license. Your team opens a browser tab and gets a sandboxed terminal with full Claude Code access. You control which dirs they can touch, monitor sessions live, and have a complete audit trail.",
    tools: ["Claude Code", "Cursor CLI", "GitHub Copilot CLI", "Aider", "Continue"],
    benefits: [
      { icon: <Lock className="h-4 w-4" />, text: "Sandboxed to project directories" },
      { icon: <Eye className="h-4 w-4" />, text: "Admin watches every session live" },
      { icon: <BarChart3 className="h-4 w-4" />, text: "Usage analytics per team member" },
      { icon: <Users className="h-4 w-4" />, text: "No API key sharing — one central login" },
    ],
    savings: "Save up to 80% on AI tool licenses",
    diagram: (
      <svg viewBox="0 0 500 180" className="w-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="50" width="120" height="80" rx="10" fill="oklch(0.18 0.015 260)" stroke="oklch(0.5 0.15 290)" strokeWidth="1.5" />
        <text x="70" y="85" textAnchor="middle" fill="oklch(0.5 0.15 290)" fontSize="11" fontWeight="600">Server</text>
        <text x="70" y="103" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="9">Claude Code x1</text>

        <path d="M140,90 L220,90" stroke="oklch(0.62 0.18 250)" strokeWidth="1.5" strokeDasharray="5,3" fill="none">
          <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="2s" repeatCount="indefinite" />
        </path>

        <rect x="230" y="50" width="100" height="80" rx="10" fill="oklch(0.18 0.015 260)" stroke="oklch(0.62 0.18 250)" strokeWidth="1.5" />
        <text x="280" y="85" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="12" fontWeight="700">DeskPort</text>
        <text x="280" y="103" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="9">auth + relay</text>

        <path d="M340,70 L390,40" stroke="oklch(0.55 0.15 150)" strokeWidth="1" fill="none" />
        <path d="M340,90 L390,90" stroke="oklch(0.55 0.15 150)" strokeWidth="1" fill="none" />
        <path d="M340,110 L390,140" stroke="oklch(0.55 0.15 150)" strokeWidth="1" fill="none" />

        <text x="430" y="45" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="10">Dev 1</text>
        <text x="430" y="95" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="10">Dev 2</text>
        <text x="430" y="145" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="10">Dev 3</text>

        <rect x="395" y="25" width="70" height="28" rx="6" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1" />
        <rect x="395" y="76" width="70" height="28" rx="6" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1" />
        <rect x="395" y="127" width="70" height="28" rx="6" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1" />

        <text x="250" y="25" textAnchor="middle" fill="oklch(0.4 0.015 260)" fontSize="9">$200/mo total instead of $600+</text>
      </svg>
    ),
  },
  {
    id: "cloud-infra",
    icon: <Cloud className="h-8 w-8" />,
    title: "Cloud Infrastructure Access",
    tagline: "Grant CLI access without sharing credentials.",
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
    iconBg: "bg-cyan-500/15 text-cyan-400",
    problem:
      "DevOps teams share AWS credentials, kubeconfig files, and SSH keys to give developers access to infrastructure. This is a security nightmare — no granular control, no audit trail, and one leaked key compromises everything.",
    solution:
      "The admin authenticates kubectl, AWS CLI, terraform etc. on the host machine once. DeskPort exposes these tools via browser terminals with per-session sandboxing. Developers never see the actual credentials.",
    tools: ["kubectl", "AWS CLI", "terraform", "gcloud", "az cli", "helm"],
    benefits: [
      { icon: <Lock className="h-4 w-4" />, text: "Credentials never leave the server" },
      { icon: <ShieldCheck className="h-4 w-4" />, text: "Restrict to specific namespaces/regions" },
      { icon: <BarChart3 className="h-4 w-4" />, text: "Every command audited for compliance" },
      { icon: <Server className="h-4 w-4" />, text: "Revoke access instantly — no key rotation" },
    ],
    savings: "Eliminate credential sharing entirely",
    diagram: (
      <svg viewBox="0 0 500 180" className="w-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="30" width="130" height="120" rx="10" fill="oklch(0.18 0.015 260)" stroke="oklch(0.45 0.15 200)" strokeWidth="1.5" />
        <text x="75" y="60" textAnchor="middle" fill="oklch(0.45 0.15 200)" fontSize="11" fontWeight="600">Bastion Host</text>
        <text x="75" y="80" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="9">kubectl config</text>
        <text x="75" y="95" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="9">~/.aws/credentials</text>
        <text x="75" y="110" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="9">terraform state</text>
        <rect x="30" y="120" width="80" height="18" rx="4" fill="oklch(0.55 0.2 25 / 0.15)" />
        <text x="70" y="133" textAnchor="middle" fill="oklch(0.55 0.2 25)" fontSize="8">NEVER EXPOSED</text>

        <path d="M150,90 L230,90" stroke="oklch(0.62 0.18 250)" strokeWidth="1.5" strokeDasharray="5,3" fill="none">
          <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="2s" repeatCount="indefinite" />
        </path>

        <rect x="240" y="55" width="90" height="70" rx="10" fill="oklch(0.18 0.015 260)" stroke="oklch(0.62 0.18 250)" strokeWidth="1.5" />
        <text x="285" y="87" textAnchor="middle" fill="oklch(0.62 0.18 250)" fontSize="11" fontWeight="700">DeskPort</text>
        <text x="285" y="105" textAnchor="middle" fill="oklch(0.65 0.015 260)" fontSize="8">I/O relay only</text>

        <path d="M340,75 L400,50" stroke="oklch(0.55 0.15 150)" strokeWidth="1" fill="none" />
        <path d="M340,90 L400,90" stroke="oklch(0.55 0.15 150)" strokeWidth="1" fill="none" />
        <path d="M340,105 L400,130" stroke="oklch(0.55 0.15 150)" strokeWidth="1" fill="none" />

        <rect x="405" y="32" width="80" height="28" rx="6" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1" />
        <text x="445" y="50" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="9">SRE team</text>
        <rect x="405" y="76" width="80" height="28" rx="6" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.15 150)" strokeWidth="1" />
        <text x="445" y="94" textAnchor="middle" fill="oklch(0.55 0.15 150)" fontSize="9">Backend devs</text>
        <rect x="405" y="118" width="80" height="28" rx="6" fill="oklch(0.18 0.015 260)" stroke="oklch(0.55 0.2 25)" strokeWidth="1" />
        <text x="445" y="136" textAnchor="middle" fill="oklch(0.55 0.2 25)" fontSize="9">Auditor (view)</text>
      </svg>
    ),
  },
  {
    id: "training",
    icon: <GraduationCap className="h-8 w-8" />,
    title: "Training & Onboarding",
    tagline: "Pre-configured terminals. Zero setup friction.",
    color: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    problem:
      "Onboarding new developers takes days — installing tools, configuring environments, getting VPN access. Training workshops waste the first hour on 'can everyone get their terminal working?'",
    solution:
      "Create session templates with pre-configured tools and directories. New hires open a link — instant access to a fully set up terminal. Instructors can monitor all sessions simultaneously.",
    tools: ["Any CLI tool", "Custom scripts", "Language REPLs", "Build tools"],
    benefits: [
      { icon: <Users className="h-4 w-4" />, text: "30 students, one template, one click" },
      { icon: <Eye className="h-4 w-4" />, text: "Instructor monitors all screens live" },
      { icon: <Code2 className="h-4 w-4" />, text: "Sessions recorded for replay/review" },
      { icon: <Lock className="h-4 w-4" />, text: "Sandboxed — students can't break things" },
    ],
    savings: "Onboarding time from days to minutes",
    diagram: null,
  },
  {
    id: "compliance",
    icon: <ShieldCheck className="h-8 w-8" />,
    title: "Compliance & Audit",
    tagline: "Every keystroke logged. Every session recorded.",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/15 text-amber-400",
    problem:
      "Regulated industries (healthcare, finance, government) need audit trails for all system access. SSH logging is fragile, and most teams have no way to prove who ran what command and when.",
    solution:
      "DeskPort records every session in asciicast format, logs every event (login, session start/end, config changes) with user IDs and timestamps, and lets admins watch sessions in real-time. Perfect for SOC 2, HIPAA, and ISO 27001 audits.",
    tools: ["Production databases", "Admin consoles", "Deployment tools", "Debug shells"],
    benefits: [
      { icon: <BarChart3 className="h-4 w-4" />, text: "Immutable audit logs per session" },
      { icon: <Eye className="h-4 w-4" />, text: "Real-time session monitoring" },
      { icon: <Terminal className="h-4 w-4" />, text: "Full terminal recordings for playback" },
      { icon: <ShieldCheck className="h-4 w-4" />, text: "SOC 2 / HIPAA / ISO 27001 ready" },
    ],
    savings: "Audit-ready from day one",
    diagram: null,
  },
];

export default function UseCasesPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.62 0.18 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.18 250) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">DeskPort</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pitch" className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Pitch Deck
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-8 pt-20 text-center">
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/70">
          Use Cases
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Built for teams that rely on{" "}
          <span className="bg-gradient-to-r from-primary to-[oklch(0.65_0.2_280)] bg-clip-text text-transparent">
            powerful CLI tools
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          From AI coding assistants to cloud infrastructure — DeskPort gives your team browser access to any CLI tool, with enterprise security built in.
        </p>

        {/* Quick jump */}
        <div className="mx-auto mt-8 flex flex-wrap justify-center gap-3">
          {useCases.map((uc) => (
            <a
              key={uc.id}
              href={`#${uc.id}`}
              className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm transition-all hover:border-primary/30 hover:bg-card"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-md ${uc.iconBg}`}>
                {uc.icon.props.children ? uc.icon : <span className="scale-50">{uc.icon}</span>}
              </span>
              {uc.title}
            </a>
          ))}
        </div>
      </section>

      {/* Use case sections */}
      {useCases.map((uc, i) => (
        <section
          key={uc.id}
          id={uc.id}
          className={`px-6 py-20 ${i % 2 === 1 ? "bg-card/20" : ""}`}
        >
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-12 lg:grid-cols-2">
              {/* Left */}
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${uc.iconBg}`}>
                  {uc.icon}
                </div>
                <h2 className="mb-2 text-3xl font-bold tracking-tight">{uc.title}</h2>
                <p className="mb-6 text-lg text-primary/80">{uc.tagline}</p>

                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-destructive/80">The Problem</h3>
                  <p className="text-muted-foreground leading-relaxed">{uc.problem}</p>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400/80">The Solution</h3>
                  <p className="text-muted-foreground leading-relaxed">{uc.solution}</p>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {uc.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary/80"
                    >
                      {tool}
                    </span>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                  <ArrowRight className="h-4 w-4" />
                  {uc.savings}
                </div>
              </div>

              {/* Right */}
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                {/* Benefits */}
                <div className="mb-8 space-y-3">
                  {uc.benefits.map((b, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {b.icon}
                      </div>
                      <span className="text-sm">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Diagram */}
                {uc.diagram && (
                  <div className="rounded-xl border border-border/30 bg-[oklch(0.12_0.015_260)] p-4">
                    {uc.diagram}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Which use case fits your team?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Start free — upgrade when you need more seats and features.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pitch"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View Pitch Deck
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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

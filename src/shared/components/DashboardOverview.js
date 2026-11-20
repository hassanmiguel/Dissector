"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PropTypes from "prop-types";
import { APP_CONFIG } from "@/shared/constants/config";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

const FEATURES = [
  {
    href: "/dashboard/endpoint",
    icon: "api",
    title: "Endpoint & Key",
    description: "Base URL, API keys and model routing",
    accent: "text-emerald-400",
  },
  {
    href: "/dashboard/providers",
    icon: "dns",
    title: "Providers",
    description: "Connect OAuth and API-key providers",
    accent: "text-sky-400",
  },
  {
    href: "/dashboard/usage",
    icon: "bar_chart",
    title: "Usage & Analytics",
    description: "Requests, tokens, cost and logs",
    accent: "text-fuchsia-400",
  },
  {
    href: "/dashboard/quota",
    icon: "data_usage",
    title: "Quota Tracker",
    description: "Live remaining quotas for your accounts",
    accent: "text-amber-400",
  },
  {
    href: "/dashboard/combos",
    icon: "layers",
    title: "Combos",
    description: "Model fallback chains and vision adapter",
    accent: "text-violet-400",
  },
  {
    href: "/dashboard/token-saver",
    icon: "savings",
    title: "Token Saver",
    description: "Compress prompts to reduce token spend",
    accent: "text-teal-400",
  },
  {
    href: "/dashboard/cli-tools",
    icon: "terminal",
    title: "CLI Tools",
    description: "Connect Claude, Codex, OpenCode and more",
    accent: "text-lime-400",
  },
  {
    href: "/dashboard/skills",
    icon: "extension",
    title: "Agent Skills",
    description: "Install ready-made skills for your AI agents",
    accent: "text-rose-400",
  },
];

const fmt = (value) => {
  const num = Number(value) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
};

const fmtCost = (value) => {
  const num = Number(value) || 0;
  if (num >= 100) return `$${num.toFixed(0)}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(4)}`;
};

const fmtTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function StatCard({ icon, label, value, sublabel, tone }) {
  return (
    <div className="card-elev border border-border-subtle/70 p-4 sm:p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">
            {label}
          </span>
          <span className={`font-mono text-2xl sm:text-3xl font-semibold tracking-tight truncate ${tone || "text-text-main"}`}>
            {value}
          </span>
          <span className="text-xs text-text-muted truncate">{sublabel}</span>
        </div>
        <span className="material-symbols-outlined text-[22px] text-primary/80 select-none">
          {icon}
        </span>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sublabel: PropTypes.string,
  tone: PropTypes.string,
};

/**
 * Landing page for the dashboard. The previous /dashboard route rendered the
 * Endpoint page directly, which made the app look like it only had one screen.
 * This overview surfaces every section plus live usage at a glance.
 */
export default function DashboardOverview({ machineId }) {
  const [stats, setStats] = useState(null);
  const [connections, setConnections] = useState([]);
  const [origin, setOrigin] = useState("http://localhost:20127");
  const { copied, copy } = useCopyToClipboard(2000);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);

    let active = true;
    const load = async () => {
      const [statsRes, providersRes] = await Promise.allSettled([
        fetch("/api/usage/stats?period=7d", { cache: "no-store" }),
        fetch("/api/providers", { cache: "no-store" }),
      ]);
      if (!active) return;
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        try { setStats(await statsRes.value.json()); } catch { /* ignore malformed payload */ }
      }
      if (providersRes.status === "fulfilled" && providersRes.value.ok) {
        try {
          const data = await providersRes.value.json();
          setConnections(Array.isArray(data?.connections) ? data.connections : []);
        } catch { /* ignore malformed payload */ }
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const tokens = useMemo(() => {
    const prompt = Number(stats?.totalPromptTokens) || 0;
    const completion = Number(stats?.totalCompletionTokens) || 0;
    return prompt + completion;
  }, [stats]);

  const endpoint = `${origin}/v1`;
  const recent = Array.isArray(stats?.recentRequests) ? stats.recentRequests.slice(0, 5) : [];
  const activeConnections = connections.filter((c) => c.isActive !== false).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Hero */}
      <section className="card-elev relative overflow-hidden border border-border-subtle/70 p-5 sm:p-7">
        <div className="absolute -right-10 -top-16 size-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[26px]">hub</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-main">
                  Welcome to {APP_CONFIG.name}
                </h1>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                  online
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm text-text-muted">
                One endpoint for all your AI providers. Manage keys, monitor usage,
                and route every coding agent through your own gateway.
              </p>
              <p className="mt-2 font-mono text-[11px] text-text-muted/80">machine: {machineId || "local"}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/dashboard/endpoint"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">api</span>
              Open endpoint
            </Link>
            <Link
              href="/dashboard/providers"
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3.5 py-2 text-sm font-medium text-text-main transition-colors hover:bg-surface-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add provider
            </Link>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section aria-label="Usage summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="calls" label="Requests · 7D" value={fmt(stats?.totalRequests)} sublabel="Routed through the gateway" tone="text-primary" />
        <StatCard icon="data_object" label="Tokens · 7D" value={fmt(tokens)} sublabel="Prompt + completion" />
        <StatCard icon="payments" label="Est. cost · 7D" value={fmtCost(stats?.totalCost)} sublabel="Based on local pricing" />
        <StatCard icon="link" label="Connections" value={fmt(activeConnections)} sublabel={`${connections.length} configured provider${connections.length === 1 ? "" : "s"}`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        {/* Feature shortcuts */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-[18px] text-primary">dashboard_customize</span>
            <h2 className="text-sm font-semibold text-text-main">Command center</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="card-soft group flex items-start gap-3 border border-border-subtle/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--shadow-warm)]"
              >
                <span className={`material-symbols-outlined text-[22px] ${feature.accent}`}>
                  {feature.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text-main">{feature.title}</span>
                    <span className="material-symbols-outlined text-[16px] text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                      arrow_forward
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-text-muted">{feature.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Side rail: endpoint + activity */}
        <aside className="flex flex-col gap-3">
          <div className="card-soft border border-border-subtle/60 p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">bolt</span>
              <h2 className="text-sm font-semibold text-text-main">Your API endpoint</h2>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-subtle bg-bg/60 p-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-text-main">{endpoint}</code>
              <button
                type="button"
                onClick={() => copy(endpoint, "endpoint")}
                className="rounded p-1.5 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Copy API endpoint"
                title="Copy endpoint"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied === "endpoint" ? "check" : "content_copy"}
                </span>
              </button>
            </div>
            <Link href="/dashboard/endpoint" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Manage key and endpoints
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="card-soft border border-border-subtle/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                <h2 className="text-sm font-semibold text-text-main">Recent activity</h2>
              </div>
              <Link href="/dashboard/usage" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="mt-4 text-xs text-text-muted">
                No requests yet. Connect a provider and point your coding agent at the endpoint above.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border-subtle/60">
                {recent.map((item, index) => (
                  <li key={`${item.timestamp}-${item.model}-${index}`} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-text-main">{item.model || "unknown"}</p>
                      <p className="truncate text-[11px] text-text-muted">{item.provider || "gateway"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[11px] text-text-muted">
                        {fmt((Number(item.promptTokens) || 0) + (Number(item.completionTokens) || 0))} tok
                      </p>
                      <p className="text-[11px] text-text-muted">{fmtTime(item.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

DashboardOverview.propTypes = {
  machineId: PropTypes.string,
};

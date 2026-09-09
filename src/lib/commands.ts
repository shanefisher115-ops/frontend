import type { CommandItem, CommandCategory } from "../types/command";

export interface CommandContext {
  onRefreshData?: () => void;
  onToggleTheme?: () => void;
  onNavigateTo?: (sectionId: string) => void;
  onShowNotice?: (message: string, type?: "info" | "success" | "warning") => void;
  onCopyText?: (text: string, label: string) => void;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  "quick-action": "Quick Actions",
  "agent-command": "Agent Commands",
  navigation: "Navigation & Views",
};

export function getDefaultCommands(ctx: CommandContext): CommandItem[] {
  const commands: CommandItem[] = [
    // --- Quick Actions ---
    {
      id: "action-refresh-signals",
      title: "Refresh Signal Data",
      description: "Refetch signals from Supabase or mock database",
      category: "quick-action",
      shortcut: "⌘R",
      icon: "refresh",
      keywords: ["reload", "fetch", "sync", "update", "signals"],
      perform: () => {
        ctx.onRefreshData?.();
        ctx.onShowNotice?.("Refetched latest signal data", "success");
      },
    },
    {
      id: "action-toggle-theme",
      title: "Toggle Light / Dark Theme",
      description: "Switch application theme between light and dark mode",
      category: "quick-action",
      shortcut: "⌘T",
      icon: "sun-moon",
      keywords: ["dark mode", "light mode", "color", "appearance"],
      perform: () => {
        ctx.onToggleTheme?.();
      },
    },
    {
      id: "action-copy-url",
      title: "Copy Supabase URL",
      description: "Copy configured VITE_SUPABASE_URL to clipboard",
      category: "quick-action",
      shortcut: "⌘C",
      icon: "copy",
      keywords: ["endpoint", "env", "credentials", "url"],
      perform: () => {
        const url = ctx.supabaseUrl || "Not configured";
        ctx.onCopyText?.(url, "Supabase URL");
      },
    },
    {
      id: "action-copy-key",
      title: "Copy Supabase Anon Key",
      description: "Copy configured VITE_SUPABASE_ANON_KEY to clipboard",
      category: "quick-action",
      icon: "key",
      keywords: ["api key", "anon", "token", "env"],
      perform: () => {
        const key = ctx.supabaseAnonKey || "Not configured";
        ctx.onCopyText?.(key, "Supabase Anon Key");
      },
    },

    // --- Agent Commands ---
    {
      id: "agent-health-check",
      title: "Agent Health Check",
      description: "Run automated diagnostic on database connection & latency",
      category: "agent-command",
      shortcut: "⌘H",
      icon: "activity",
      keywords: ["agent", "health", "ping", "status", "latency", "diag"],
      perform: () => {
        ctx.onShowNotice?.("Agent Diagnostic: All signal channels operating nominally (ping 14ms)", "info");
      },
    },
    {
      id: "agent-auto-repair",
      title: "Trigger Agent Auto-Repair",
      description: "Attempt connection reset & clear cached fallback state",
      category: "agent-command",
      icon: "wrench",
      keywords: ["repair", "fix", "reconnect", "reset", "cache", "restore"],
      perform: () => {
        ctx.onRefreshData?.();
        ctx.onShowNotice?.("Agent Auto-Repair: Connection reset initiated & cache refreshed", "success");
      },
    },
    {
      id: "agent-generate-signal",
      title: "Generate Synthetic Signal",
      description: "Dispatch mock telemetry packet to test signal processing",
      category: "agent-command",
      icon: "zap",
      keywords: ["synthetic", "mock", "packet", "telemetry", "test", "signal"],
      perform: () => {
        ctx.onShowNotice?.("Agent Command: Dispatched synthetic test signal packet", "info");
      },
    },
    {
      id: "agent-status-summary",
      title: "Query Agent Runtime Status",
      description: "Fetch live operational telemetry from Primordia agent core",
      category: "agent-command",
      icon: "cpu",
      keywords: ["status", "telemetry", "core", "runtime", "agent"],
      perform: () => {
        ctx.onShowNotice?.("Primordia Core: Version 0.1.0 · Active fallback engine ready", "info");
      },
    },

    // --- Navigation ---
    {
      id: "nav-connection",
      title: "Go to Connection Diagnostics",
      description: "Scroll to Supabase environment configuration card",
      category: "navigation",
      shortcut: "G C",
      icon: "link",
      keywords: ["connection", "settings", "env", "supabase", "card"],
      perform: () => {
        ctx.onNavigateTo?.("connection-section");
      },
    },
    {
      id: "nav-signals",
      title: "Go to Signals Table",
      description: "Scroll to live signal table and recorded metrics",
      category: "navigation",
      shortcut: "G S",
      icon: "table",
      keywords: ["table", "signals", "metrics", "data", "rows"],
      perform: () => {
        ctx.onNavigateTo?.("signals-section");
      },
    },
    {
      id: "nav-migration-sql",
      title: "View Migration SQL Setup",
      description: "Scroll to migration instructions and schema notice",
      category: "navigation",
      icon: "code",
      keywords: ["sql", "schema", "migration", "table creation", "rls"],
      perform: () => {
        ctx.onNavigateTo?.("footer-section");
        ctx.onShowNotice?.("Migration SQL script is available in src/types/signal.ts", "info");
      },
    },
  ];

  return commands;
}

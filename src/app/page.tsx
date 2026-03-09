"use client";

import "@copilotkit/react-core/v2/styles.css";
import {
  CopilotChat,
  CopilotKitProvider,
  ToolCallStatus,
  useFrontendTool,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { createA2UIMessageRenderer, A2UIViewer } from "@copilotkit/a2ui-renderer";
import { z } from "zod";
import { useState, useCallback } from "react";

import { withA2UIActivityMessage } from "@/components/a2ui-activity-wrapper";
import { theme } from "./theme";
import { CalendarView, CalendarLoadingState } from "@/components/calendar-view";
import type { CalendarEvent } from "@/components/calendar-view";
import { InboxView, InboxLoadingState } from "@/components/inbox-view";
import type { Email } from "@/components/inbox-view";
import { EmailComposeView, EmailComposeLoadingState } from "@/components/email-compose-view";
import type { EmailComposeData } from "@/components/email-compose-view";

// Disable static optimization for this page
export const dynamic = "force-dynamic";

const BaseA2UIMessageRenderer = createA2UIMessageRenderer({ theme });
const A2UIMessageRenderer = withA2UIActivityMessage(BaseA2UIMessageRenderer);
const activityRenderers = [A2UIMessageRenderer];

// ---------------------------------------------------------------------------
// Canvas state — supports A2UI dashboard + native React components
// ---------------------------------------------------------------------------

type CanvasContent =
  | { type: "dashboard"; root: string; components: any[]; data: Record<string, unknown> }
  | { type: "calendar"; date: string; dayName: string; events: CalendarEvent[] }
  | { type: "inbox"; emails: Email[] }
  | { type: "email"; email: EmailComposeData };

interface CanvasState {
  mode: "chat" | "canvas";
  content: CanvasContent | null;
}

const CANVAS_TITLES: Record<CanvasContent["type"], string> = {
  dashboard: "Daily Brief",
  calendar: "Schedule",
  inbox: "Inbox",
  email: "Email",
};

// ---------------------------------------------------------------------------
// Shared loading spinner
// ---------------------------------------------------------------------------

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md text-gray-500 text-sm mb-3">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact tool card — shown in chat sidebar when content is in canvas
// ---------------------------------------------------------------------------

const CARD_ICONS: Record<string, React.ReactNode> = {
  calendar: (
    <svg className="compact-tool-card-icon compact-tool-card-icon--indigo" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  inbox: (
    <svg className="compact-tool-card-icon compact-tool-card-icon--blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  email: (
    <svg className="compact-tool-card-icon compact-tool-card-icon--emerald" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  dashboard: (
    <svg className="compact-tool-card-icon compact-tool-card-icon--indigo" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
};

function CompactToolCard({
  icon,
  title,
  summary,
  buttonLabel = "Show inline",
  onAction,
}: {
  icon: string;
  title: string;
  summary: string;
  buttonLabel?: string;
  onAction: () => void;
}) {
  const isCanvasAction = buttonLabel.toLowerCase().includes("canvas");
  return (
    <div className="compact-tool-card">
      <div className="compact-tool-card-header">
        {CARD_ICONS[icon] ?? CARD_ICONS.dashboard}
        <div className="compact-tool-card-text">
          <span className="compact-tool-card-title">{title}</span>
          <span className="compact-tool-card-summary">{summary}</span>
        </div>
      </div>
      <button type="button" className="compact-tool-card-btn" onClick={onAction}>
        {buttonLabel}
        {isCanvasAction ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas panel — renders content by type
// ---------------------------------------------------------------------------

function CanvasContentRenderer({ content }: { content: CanvasContent }) {
  switch (content.type) {
    case "dashboard":
      return (
        <A2UIViewer
          root={content.root}
          components={content.components}
          data={content.data}
          styles={{ primaryColor: "#4f46e5", font: "Inter, system-ui, sans-serif" }}
          className="canvas-a2ui"
        />
      );
    case "calendar":
      return <div className="canvas-content-centered"><CalendarView date={content.date} dayName={content.dayName} events={content.events} /></div>;
    case "inbox":
      return <div className="canvas-content-centered"><InboxView emails={content.emails} /></div>;
    case "email":
      return <div className="canvas-content-centered"><EmailComposeView email={content.email} /></div>;
  }
}

function Canvas({ content, onClose }: { content: CanvasContent; onClose: () => void }) {
  return (
    <div className="canvas-panel">
      <div className="canvas-header">
        <div className="canvas-header-left">
          {CARD_ICONS[content.type]}
          <span className="canvas-header-title">{CANVAS_TITLES[content.type]}</span>
        </div>
        <button type="button" className="canvas-header-close" onClick={onClose} title="Close canvas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="canvas-body">
        <CanvasContentRenderer content={content} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat component — registers all frontend tools
// ---------------------------------------------------------------------------

function Chat({
  isCanvasMode,
  hasCanvasContent,
  onCanvasUpdate,
  onMaximize,
  onMinimize,
}: {
  isCanvasMode: boolean;
  hasCanvasContent: boolean;
  onCanvasUpdate: (content: CanvasContent) => void;
  onMaximize: () => void;
  onMinimize: () => void;
}) {
  // A2UI fallback tool
  useFrontendTool(
    {
      name: "send_a2ui_json_to_client",
      description: "Sends A2UI JSON to the client to render rich UI",
      parameters: z.object({ a2ui_json: z.string() }) as any,
      render: ({ status }) => status !== ToolCallStatus.Complete ? <LoadingSpinner label="Building interface..." /> : null,
    },
    []
  );

  // Daily brief — always routes to canvas
  useFrontendTool(
    {
      name: "render_daily_brief",
      description: "Renders a daily brief dashboard in the canvas workspace",
      parameters: z.object({
        components: z.string(),
        data: z.string(),
        root: z.string(),
      }) as any,
      handler: async ({ components, data, root }: { components: string; data: string; root: string }) => {
        try {
          onCanvasUpdate({
            type: "dashboard",
            root,
            components: JSON.parse(components),
            data: JSON.parse(data),
          });
        } catch (e) {
          console.error("Failed to parse daily brief data", e);
          return "Failed to render dashboard - invalid JSON";
        }
        return "Dashboard rendered in canvas workspace";
      },
      render: ({ status }) => {
        if (status !== ToolCallStatus.Complete) return <LoadingSpinner label="Building dashboard..." />;
        if (isCanvasMode) {
          return (
            <CompactToolCard
              icon="dashboard"
              title="Daily Brief"
              summary="Opened in canvas"
              buttonLabel="Show inline"
              onAction={onMaximize}
            />
          );
        }
        // In chat mode: show a card with "Show in canvas" to restore
        return (
          <CompactToolCard
            icon="dashboard"
            title="Daily Brief"
            summary={hasCanvasContent ? "Dashboard ready" : "Opened in canvas"}
            buttonLabel="Show in canvas"
            onAction={onMinimize}
          />
        );
      },
    },
    [onCanvasUpdate, onMaximize, onMinimize, isCanvasMode, hasCanvasContent]
  );

  // Calendar — routes to canvas when open, inline otherwise
  useFrontendTool(
    {
      name: "render_calendar",
      description: "Renders a rich calendar day-view with the user's schedule",
      parameters: z.object({
        date: z.string(),
        dayName: z.string(),
        events: z.string(),
      }) as any,
      handler: async ({ date, dayName, events }: { date: string; dayName: string; events: string }) => {
        if (isCanvasMode) {
          try {
            onCanvasUpdate({ type: "calendar", date, dayName, events: JSON.parse(events) });
          } catch (e) { console.error("Failed to parse calendar for canvas", e); }
        }
        return "Calendar rendered";
      },
      render: ({ status, args }: { status: ToolCallStatus; args?: { date: string; dayName: string; events: string } }) => {
        if (status !== ToolCallStatus.Complete || !args) return <CalendarLoadingState />;
        let events: CalendarEvent[] = [];
        try { events = JSON.parse(args.events); } catch { /* empty */ }

        if (isCanvasMode) {
          const bookedCount = events.filter((e) => !e.isAvailable).length;
          return (
            <CompactToolCard
              icon="calendar"
              title={`Schedule — ${args.dayName}`}
              summary={`${bookedCount} meeting${bookedCount !== 1 ? "s" : ""} today`}
              onAction={onMaximize}
            />
          );
        }
        return <CalendarView date={args.date} dayName={args.dayName} events={events} />;
      },
    },
    [isCanvasMode, onCanvasUpdate, onMaximize]
  );

  // Inbox — routes to canvas when open, inline otherwise
  useFrontendTool(
    {
      name: "render_inbox",
      description: "Renders a Gmail-style inbox view with email messages",
      parameters: z.object({
        emails: z.string(),
      }) as any,
      handler: async ({ emails }: { emails: string }) => {
        if (isCanvasMode) {
          try {
            const parsed = JSON.parse(emails);
            const mapped = parsed.map((e: any, i: number) => ({
              id: String(i), from: e.from, subject: e.subject,
              preview: e.body?.substring(0, 80) || "", body: e.body || "",
              date: e.date || "Today", isRead: e.isRead ?? false,
            }));
            onCanvasUpdate({ type: "inbox", emails: mapped });
          } catch (e) { console.error("Failed to parse inbox for canvas", e); }
        }
        return "Inbox rendered";
      },
      render: ({ status, args }: { status: ToolCallStatus; args?: { emails: string } }) => {
        if (status !== ToolCallStatus.Complete || !args) return <InboxLoadingState />;
        let emails: Email[] = [];
        try {
          const parsed = JSON.parse(args.emails);
          emails = parsed.map((e: any, i: number) => ({
            id: String(i), from: e.from, subject: e.subject,
            preview: e.body?.substring(0, 80) || "", body: e.body || "",
            date: e.date || "Today", isRead: e.isRead ?? false,
          }));
        } catch { /* empty */ }

        if (isCanvasMode) {
          const unread = emails.filter((e) => !e.isRead).length;
          return (
            <CompactToolCard
              icon="inbox"
              title="Inbox"
              summary={`${emails.length} message${emails.length !== 1 ? "s" : ""} · ${unread} unread`}
              onAction={onMaximize}
            />
          );
        }
        return <InboxView emails={emails} />;
      },
    },
    [isCanvasMode, onCanvasUpdate, onMaximize]
  );

  // Email compose — routes to canvas when open, inline otherwise
  useFrontendTool(
    {
      name: "render_email_compose",
      description: "Renders a Gmail-style email compose view",
      parameters: z.object({
        email: z.string(),
      }) as any,
      handler: async ({ email }: { email: string }) => {
        if (isCanvasMode) {
          try { onCanvasUpdate({ type: "email", email: JSON.parse(email) }); }
          catch (e) { console.error("Failed to parse email for canvas", e); }
        }
        return "Email compose rendered";
      },
      render: ({ status, args }: { status: ToolCallStatus; args?: { email: string } }) => {
        if (status !== ToolCallStatus.Complete || !args) return <EmailComposeLoadingState />;
        let email: EmailComposeData = { to: "", subject: "", body: "" };
        try { email = JSON.parse(args.email); } catch { /* empty */ }

        if (isCanvasMode) {
          const isReply = email.subject.startsWith("Re:");
          return (
            <CompactToolCard
              icon="email"
              title={isReply ? "Reply" : "New Message"}
              summary={`To: ${email.to} · ${email.subject}`}
              onAction={onMaximize}
            />
          );
        }
        return <EmailComposeView email={email} />;
      },
    },
    [isCanvasMode, onCanvasUpdate, onMaximize]
  );

  useConfigureSuggestions({
    suggestions: [
      { title: "Daily brief", message: "Create my daily brief" },
      { title: "View my schedule", message: "Show me my schedule for today" },
      { title: "Check inbox", message: "Check my inbox" },
      { title: "Compose email", message: "Help me draft an email" },
    ],
    available: "before-first-message",
  }, []);

  return (
    <CopilotChat
      className="flex-1 min-h-0 overflow-hidden"
      agentId="my_a2ui_agent"
      labels={{
        welcomeMessageText:
          "Hi! I'm your scheduling assistant. I can help you check your calendar, read emails, and compose messages.",
        chatInputPlaceholder: "Ask about your schedule, inbox, or compose an email...",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Page — orchestrates layout modes
// ---------------------------------------------------------------------------

export default function Page() {
  const [canvas, setCanvas] = useState<CanvasState>({
    mode: "chat",
    content: null,
  });

  const handleCanvasUpdate = useCallback((content: CanvasContent) => {
    setCanvas({ mode: "canvas", content });
  }, []);

  const handleMaximize = useCallback(() => {
    setCanvas((prev) => ({ ...prev, mode: "chat" }));
  }, []);

  const handleMinimize = useCallback(() => {
    setCanvas((prev) => {
      if (prev.content) return { ...prev, mode: "canvas" };
      return prev;
    });
  }, []);

  const isCanvasMode = canvas.mode === "canvas" && canvas.content !== null;

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      showDevConsole="auto"
      renderActivityMessages={activityRenderers}
    >
      <div className={`a2ui-chat-container flex h-full min-h-0 overflow-hidden ${isCanvasMode ? "layout-split" : "layout-chat"}`}>
        {isCanvasMode && canvas.content && (
          <Canvas content={canvas.content} onClose={handleMaximize} />
        )}
        <div className={`chat-panel flex flex-col min-h-0 overflow-hidden ${isCanvasMode ? "chat-sidebar" : "flex-1"}`}>
          <Chat isCanvasMode={isCanvasMode} hasCanvasContent={canvas.content !== null} onCanvasUpdate={handleCanvasUpdate} onMaximize={handleMaximize} onMinimize={handleMinimize} />
        </div>
      </div>
    </CopilotKitProvider>
  );
}

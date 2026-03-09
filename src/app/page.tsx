"use client";

import "@copilotkit/react-core/v2/styles.css";
import {
  CopilotChat,
  CopilotKitProvider,
  ToolCallStatus,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { createA2UIMessageRenderer } from "@copilotkit/a2ui-renderer";
import { z } from "zod";

import { withA2UIActivityMessage } from "@/components/a2ui-activity-wrapper";
import { theme } from "./theme";
import { CalendarView, CalendarLoadingState } from "@/components/calendar-view";
import type { CalendarEvent } from "@/components/calendar-view";
import { InboxView, InboxLoadingState } from "@/components/inbox-view";
import type { Email } from "@/components/inbox-view";

// Disable static optimization for this page
export const dynamic = "force-dynamic";

const BaseA2UIMessageRenderer = createA2UIMessageRenderer({ theme });
const A2UIMessageRenderer =
  withA2UIActivityMessage(BaseA2UIMessageRenderer);

const activityRenderers = [A2UIMessageRenderer];

function A2UILoadingIndicator({ status }: { status: ToolCallStatus }) {
  if (status === ToolCallStatus.Complete) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md text-gray-500 text-sm mb-3">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>Building interface...</span>
    </div>
  );
}

function Chat() {
  useFrontendTool(
    {
      name: "send_a2ui_json_to_client",
      description: "Sends A2UI JSON to the client to render rich UI",
      parameters: z.object({
        a2ui_json: z.string(),
      }) as any,
      render: ({ status }) => <A2UILoadingIndicator status={status} />,
    },
    []
  );

  useFrontendTool(
    {
      name: "render_calendar",
      description: "Renders a rich calendar day-view with the user's schedule",
      parameters: z.object({
        date: z.string().describe("The date, e.g. '2026-02-02'"),
        dayName: z.string().describe("Day of the week, e.g. 'Monday'"),
        events: z.string().describe("JSON array of event objects with startTime, endTime, title, isAvailable"),
      }) as any,
      render: ({ status, args }: { status: ToolCallStatus; args?: { date: string; dayName: string; events: string } }) => {
        if (status !== ToolCallStatus.Complete || !args) {
          return <CalendarLoadingState />;
        }
        let events: CalendarEvent[] = [];
        try {
          events = JSON.parse(args.events);
        } catch {
          events = [];
        }
        return <CalendarView date={args.date} dayName={args.dayName} events={events} />;
      },
    },
    []
  );

  useFrontendTool(
    {
      name: "render_inbox",
      description: "Renders a Gmail-style inbox view with email messages",
      parameters: z.object({
        emails: z.string().describe("JSON array of email objects with from, subject, body, date fields"),
      }) as any,
      render: ({ status, args }: { status: ToolCallStatus; args?: { emails: string } }) => {
        if (status !== ToolCallStatus.Complete || !args) {
          return <InboxLoadingState />;
        }
        let emails: Email[] = [];
        try {
          const parsed = JSON.parse(args.emails);
          emails = parsed.map((e: { from: string; subject: string; body?: string; date?: string; isRead?: boolean }, i: number) => ({
            id: String(i),
            from: e.from,
            subject: e.subject,
            preview: e.body?.substring(0, 100) || "",
            date: e.date || "Today",
            isRead: e.isRead ?? false,
          }));
        } catch {
          emails = [];
        }
        return <InboxView emails={emails} />;
      },
    },
    []
  );

  return (
    <CopilotChat
      className="flex-1 min-h-0 overflow-hidden"
      agentId="my_a2ui_agent"
    />
  );
}

export default function Page() {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      showDevConsole="auto"
      renderActivityMessages={activityRenderers}
    >
      <div className="a2ui-chat-container flex h-full min-h-0 flex-col overflow-hidden">
        <Chat />
      </div>
    </CopilotKitProvider>
  );
}

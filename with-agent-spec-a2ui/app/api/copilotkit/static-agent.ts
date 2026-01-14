import { Observable } from "rxjs";
import {
  EventType,
  type BaseEvent,
  AbstractAgent,
  type RunAgentInput,
  type RunStartedEvent,
  type ActivitySnapshotEvent,
  type RunFinishedEvent,
} from "@ag-ui/client";
import { randomUUID } from "crypto";

// A minimal agent that always emits a default A2UI surface.
export class StaticA2UIAgent extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const started: RunStartedEvent = {
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
      };
      subscriber.next(started);

      const messageId = randomUUID();

      const content: Record<string, any> = {
        operations: [
          {
            beginRendering: {
              surfaceId: "default",
              root: "root",
              styles: { primaryColor: "#00BFFF", font: "Roboto" },
            },
          },
          {
            surfaceUpdate: {
              surfaceId: "default",
              components: [
                { id: "root", component: { Card: { child: "main-column" } } },
                {
                  id: "main-column",
                  component: {
                    Column: {
                      children: {
                        explicitList: [
                          "from-row",
                          "to-row",
                          "subject-row",
                          "divider",
                          "message",
                          "actions",
                        ],
                      },
                      gap: "small",
                    },
                  },
                },
                {
                  id: "from-row",
                  component: {
                    Row: {
                      children: { explicitList: ["from-label", "from-value"] },
                      gap: "medium",
                      alignment: "center",
                    },
                  },
                },
                {
                  id: "from-label",
                  component: {
                    Text: {
                      text: { literalString: "FROM" },
                      usageHint: "caption",
                    },
                  },
                },
                {
                  id: "from-value",
                  component: {
                    Text: { text: { path: "/from" }, usageHint: "body" },
                  },
                },
                {
                  id: "to-row",
                  component: {
                    Row: {
                      children: { explicitList: ["to-label", "to-value"] },
                      gap: "medium",
                      alignment: "center",
                    },
                  },
                },
                {
                  id: "to-label",
                  component: {
                    Text: {
                      text: { literalString: "TO" },
                      usageHint: "caption",
                    },
                  },
                },
                {
                  id: "to-value",
                  component: {
                    Text: { text: { path: "/to" }, usageHint: "body" },
                  },
                },
                {
                  id: "subject-row",
                  component: {
                    Row: {
                      children: {
                        explicitList: ["subject-label", "subject-value"],
                      },
                      gap: "medium",
                      alignment: "center",
                    },
                  },
                },
                {
                  id: "subject-label",
                  component: {
                    Text: {
                      text: { literalString: "SUBJECT" },
                      usageHint: "caption",
                    },
                  },
                },
                {
                  id: "subject-value",
                  component: {
                    Text: { text: { path: "/subject" }, usageHint: "body" },
                  },
                },
                { id: "divider", component: { Divider: {} } },
                {
                  id: "message",
                  component: {
                    Column: {
                      children: {
                        explicitList: [
                          "greeting",
                          "body-text",
                          "closing",
                          "signature",
                        ],
                      },
                      gap: "small",
                    },
                  },
                },
                { id: "greeting", component: { Text: { text: { path: "/greeting" }, usageHint: "body" } } },
                { id: "body-text", component: { Text: { text: { path: "/body" }, usageHint: "body" } } },
                { id: "closing", component: { Text: { text: { path: "/closing" }, usageHint: "body" } } },
                { id: "signature", component: { Text: { text: { path: "/signature" }, usageHint: "body" } } },
                {
                  id: "actions",
                  component: {
                    Row: {
                      children: { explicitList: ["send-btn", "discard-btn"] },
                      gap: "small",
                    },
                  },
                },
                {
                  id: "send-btn-text",
                  component: { Text: { text: { literalString: "Send email" } } },
                },
                {
                  id: "send-btn",
                  component: { Button: { child: "send-btn-text", action: "send" } },
                },
                {
                  id: "discard-btn-text",
                  component: { Text: { text: { literalString: "Discard" } } },
                },
                {
                  id: "discard-btn",
                  component: { Button: { child: "discard-btn-text", action: "discard" } },
                },
              ],
            },
          },
          {
            dataModelUpdate: {
              surfaceId: "default",
              path: "/",
              contents: [
                { key: "from", valueString: "alex@acme.com" },
                { key: "to", valueString: "jordan@acme.com" },
                { key: "subject", valueString: "Q4 Revenue Forecast" },
                { key: "greeting", valueString: "Hi Jordan," },
                {
                  key: "body",
                  valueString:
                    "Following up on our call. Please review the attached Q4 forecast and let me know if you have questions before the board meeting.",
                },
                { key: "closing", valueString: "Best," },
                { key: "signature", valueString: "Alex" },
              ],
            },
          },
        ],
      };

      const activity: ActivitySnapshotEvent = {
        type: EventType.ACTIVITY_SNAPSHOT,
        messageId: messageId,
        activityType: "a2ui-surface",
        content,
        replace: true,
      };
      subscriber.next(activity);

      const finished: RunFinishedEvent = {
        type: EventType.RUN_FINISHED,
        threadId: input.threadId,
        runId: input.runId,
      };
      subscriber.next(finished);
      subscriber.complete();
    });
  }
}


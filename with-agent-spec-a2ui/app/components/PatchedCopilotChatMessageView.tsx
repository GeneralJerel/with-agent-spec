"use client";

import React from "react";
import {
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
  useRenderActivityMessage,
  useRenderCustomMessages,
} from "@copilotkit/react-core/v2";
import type { Message, AssistantMessage, UserMessage, ActivityMessage } from "@ag-ui/core";

type Props = {
  messages?: Message[];
  isRunning?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function PatchedCopilotChatMessageView({
  messages = [],
  isRunning = false,
  className,
  ...props
}: Props) {
  const renderCustomMessage = useRenderCustomMessages();
  const renderActivityMessage = useRenderActivityMessage();

  const messageElements: React.ReactElement[] = messages
    .flatMap((message) => {
      const elements: (React.ReactElement | null | undefined)[] = [];

      if (renderCustomMessage) {
        elements.push(
          <React.Fragment key={`${message.id}-${message.role}-custom-before`}>
            {renderCustomMessage({ message, position: "before" })}
          </React.Fragment>
        );
      }

      if (message.role === "assistant") {
        elements.push(
          <CopilotChatAssistantMessage
            key={`${message.id}-assistant`}
            message={message as AssistantMessage}
            messages={messages}
            isRunning={isRunning}
          />
        );
      } else if (message.role === "user") {
        elements.push(
          <CopilotChatUserMessage key={`${message.id}-user`} message={message as UserMessage} />
        );
      } else if (message.role === "activity") {
        const rendered = renderActivityMessage?.(message as ActivityMessage);
        if (rendered) {
          elements.push(<React.Fragment key={`${message.id}-activity`}>{rendered}</React.Fragment>);
        }
      }

      if (renderCustomMessage) {
        elements.push(
          <React.Fragment key={`${message.id}-${message.role}-custom-after`}>
            {renderCustomMessage({ message, position: "after" })}
          </React.Fragment>
        );
      }

      return elements;
    })
    .filter(Boolean) as React.ReactElement[];

  return (
    <div className={("flex flex-col" + (className ? " " + className : ""))} {...props}>
      {messageElements}
      {/* cursor not required for this quick patch */}
    </div>
  );
}

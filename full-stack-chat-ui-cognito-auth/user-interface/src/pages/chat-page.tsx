import React, { useState } from "react";
import BaseAppLayout from "../components/base-app-layout";
import { ChatUI } from "../components/chat-ui/chat-ui";
import { ChatMessage, ChatMessageType } from "../components/chat-ui/types";
import { Badge, SpaceBetween } from "@cloudscape-design/components";
import { ApiClient } from "../common/api-client/api-client";

export default function ChatPage() {
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);



  const renderExpandableContent = (message:ChatMessage) => {
    return (
      message.type === ChatMessageType.AI ?
        <React.Fragment>
            <SpaceBetween size="xs" direction="horizontal">
              <Badge color="blue">
                latency: {message.metadata?.latencyMs}ms
              </Badge>
            </SpaceBetween>
        </React.Fragment> :
         undefined
    )
  }
  const sendMessage = async (message: string) => {
    setRunning(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: ChatMessageType.Human, content: message },
      { type: ChatMessageType.AI, content: ""}
    ])

    const apiClient = new ApiClient();

    const startTime = performance.now();
    const result = await apiClient.chatClient.chat(message);
    const endTime = performance.now();

    const elapsedTime = endTime - startTime;

    setMessages((prevMessages) => [
      ...prevMessages.slice(0, prevMessages.length - 1), // Copy all but the last item
      {
        type: ChatMessageType.AI,
        content: result.response.message,
        metadata:{latencyMs: elapsedTime}
      },
    ]);
    setRunning(false);
  };

  const onSendFeedback = (feedback: any, message: ChatMessage) => {
    console.log(feedback, message);
  }

  return (
    <BaseAppLayout
      content={
        <ChatUI
          onSendMessage={sendMessage}
          messages={messages}
          running={running}
          onSendFeedback={onSendFeedback}
          renderExpandableContent={renderExpandableContent}
        />
      }
    />
  );
}

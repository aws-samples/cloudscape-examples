import { useState } from "react";
import BaseAppLayout from "../components/base-app-layout";
import { ChatUI } from "../components/chat-ui/chat-ui";
import { ChatMessage, ChatMessageType } from "../components/chat-ui/types";
import { ApiClient } from "../common/api-client/api-client";

export default function ChatPage() {
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = async (message: string) => {
    setRunning(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: ChatMessageType.Human, content: message },
      { type: ChatMessageType.AI, content: ""}
    ])

    const apiClient = new ApiClient();
    const result = await apiClient.chatClient.chat(message);
    console.log(result);

    setMessages((prevMessages) => [
      ...prevMessages.slice(0, prevMessages.length - 1), // Copy all but the last item
      {
        ...prevMessages[prevMessages.length - 1], // Copy the last item
        message: result.response
      }
    ]);
  };

  return (
    <BaseAppLayout
      content={
        <ChatUI
          onSendMessage={sendMessage}
          messages={messages}
          running={running}
        />
      }
    />
  );
}

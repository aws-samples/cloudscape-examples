import { SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import { ChatMessage } from "./types";
import ChatUIInputPanel from "./chat-ui-input-panel";
import ChatUIMessage from "./chat-ui-message";
import styles from "../../styles/chat-ui.module.scss";
import { ReactElement, useEffect } from "react";

export interface ChatUIProps {
  loading?: boolean;
  running?: boolean;
  messages?: ChatMessage[];
  welcomeText?: string;
  inputPlaceholderText?: string;
  sendButtonText?: string;
  renderExpandableContent?:(message:ChatMessage) => ReactElement | undefined;
  onSendMessage?: (message: string) => void;
  onSendFeedback?: (feedback: string, message: ChatMessage) => void;
}

export abstract class ChatScrollState {
  static userHasScrolled = false;
  static skipNextScrollEvent = false;
  static skipNextHistoryUpdate = false;
}

export function ChatUI(props: ChatUIProps) {
  const messages = props.messages || [];

  useEffect(() => {
    const onWindowScroll = () => {
      if (ChatScrollState.skipNextScrollEvent) {
        ChatScrollState.skipNextScrollEvent = false;
        return;
      }

      const isScrollToTheEnd =
        Math.abs(
          window.innerHeight +
            window.scrollY -
            document.documentElement.scrollHeight
        ) <= 10;

      if (!isScrollToTheEnd) {
        ChatScrollState.userHasScrolled = true;
      } else {
        ChatScrollState.userHasScrolled = false;
      }
    };

    window.addEventListener("scroll", onWindowScroll);

    return () => {
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, []);

  return (
    <div className={styles.chat_container}>
      <SpaceBetween direction="vertical" size="m">
        {messages.map((message, idx) => {
          return (
            <ChatUIMessage
              key={idx}
              message={message}
              onSendFeedback={props.onSendFeedback}
              renderExpandableContent={props.renderExpandableContent}
            />
          );
        })}
      </SpaceBetween>
      <div className={styles.welcome_text}>
        {messages.length == 0 && !props.loading && (
          <center>{props.welcomeText ?? "Chat Bot demo app"}</center>
        )}
        {props.loading && (
          <center>
            <StatusIndicator type="loading">Loading</StatusIndicator>
          </center>
        )}
      </div>
      <div className={styles.input_container}>
        <ChatUIInputPanel {...props} />
      </div>
    </div>
  );
}

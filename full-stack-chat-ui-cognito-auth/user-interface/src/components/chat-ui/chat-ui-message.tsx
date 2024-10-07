import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { ChatMessage, ChatMessageType } from "./types";
import styles from "../../styles/chat-ui.module.scss";
import { BaseChatMessage } from "./BaseChatMessage";
import React, { ReactElement } from "react";

export interface ChatUIMessageProps {
  readonly message: ChatMessage;
  readonly renderExpandableContent?:(message:ChatMessage) => ReactElement | undefined;
  readonly onSendFeedback?: (feedback: any, message: ChatMessage) => void;

}


export default function ChatUIMessage(props: ChatUIMessageProps) {
  return (
    <BaseChatMessage
      role={props.message?.type === ChatMessageType.AI ? "ai" : "human"}
      onCopy={() => {
        navigator.clipboard.writeText(props.message.content);
      }}
      onFeedback={
        Object.keys(props.message.content).length > 0
        ? (feedback) => {
            props.onSendFeedback?.(feedback, props.message, )
          }
        : undefined
      }
      expandableContent={props.renderExpandableContent?.(props.message)}
      waiting={props.message.content.length === 0}
      name={props.message?.type === ChatMessageType.AI ? "Ai" : "User"}
    >
      <React.Fragment>
      <ReactMarkdown
        className={styles.markdown}
        remarkPlugins={[remarkGfm]}
        components={{
          pre(props) {
            const { children, ...rest } = props;
            return (
              <pre {...rest} className={styles.codeMarkdown}>
                {children}
              </pre>
            );
          },
          table(props) {
            const { children, ...rest } = props;
            return (
              <table {...rest} className={styles.markdownTable}>
                {children}
              </table>
            );
          },
          th(props) {
            const { children, ...rest } = props;
            return (
              <th {...rest} className={styles.markdownTableCell}>
                {children}
              </th>
            );
          },
          td(props) {
            const { children, ...rest } = props;
            return (
              <td {...rest} className={styles.markdownTableCell}>
                {children}
              </td>
            );
          },
        }}
      >
        {props.message.content.trim()}
      </ReactMarkdown>

      </React.Fragment>
    </BaseChatMessage>
  );
}

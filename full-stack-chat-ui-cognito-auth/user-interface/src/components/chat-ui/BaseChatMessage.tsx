import {
  Button,
  ExpandableSection,
  SpaceBetween,
} from "@cloudscape-design/components";
import { ReactElement, useState } from "react";
import styles from "../../styles/chat-ui.module.scss";
import { CopyWithPopoverButton } from "./CopyButton";
import Avatar from "@cloudscape-design/chat-components/avatar";
import * as awsui from "@cloudscape-design/design-tokens";

export function BaseChatMessage(props: {
  readonly role: "ai" | "human";
  readonly waiting?: boolean;
  readonly name?: string;
  readonly avatarElement?: ReactElement;
  readonly children?: ReactElement;
  readonly expandableContent?: ReactElement;
  readonly onFeedback?: (thumb: "up" | "down" | 'none') => void;
  readonly onCopy?: () => void;
}) {
  const [thumb, setThumbs] = useState<"up" | "down" | undefined>(undefined);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        justifyContent: "left",
        alignItems: "flex-start",
      }}
    >
      <Avatar
        ariaLabel={props.name || props.role}
        tooltipText={props.name || props.role}
        color={props.role === 'ai' ? "gen-ai" : 'default'}
        loading={props.waiting}
        iconName={props.role === 'ai' ? 'gen-ai':'user-profile'}
      />
      {props.children && (
        <div
          style={{
            flexDirection: "column",
            flexGrow: 1,
            backgroundColor:
              props.role === "ai"
                ? awsui.colorBackgroundButtonPrimaryDisabled
                : awsui.colorBackgroundContainerContent,
            borderRadius: "0.1em",
            padding: "0.5em",
          }}
        >
          <div
            style={{
              flexDirection: "row",
              flexGrow: "2",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              marginBottom: "0.4em",
            }}
          >
            {props.children}
          </div>

          {(props.onCopy || props.onFeedback) && !props.waiting && (
            <div className={styles.btn_chabot_message_copy}>
              <SpaceBetween direction="horizontal" size="xxs">
                {props.role === "ai" && props.onFeedback && (
                  <>
                    {thumb != "down" && (
                      <Button
                        variant="icon"
                        iconName={
                          thumb == "up" ? "thumbs-up-filled" : "thumbs-up"
                        }
                        disabled={props.waiting}
                        onClick={() => {
                          props.onFeedback!(thumb != "up" ? "up" : 'none');
                          thumb != "up" ? setThumbs("up") : setThumbs(undefined);
                        }}
                      />
                    )}
                    {thumb != "up" && (
                      <div style={{ fontSize: "0.9em" }}>
                        <Button
                          variant="icon"
                          disabled={props.waiting}
                          iconName={
                            thumb == "down"
                              ? "thumbs-down-filled"
                              : "thumbs-down"
                          }
                          onClick={() => {
                            props.onFeedback!(thumb != "down" ? "down":'none');
                            thumb != "down"
                              ? setThumbs("down")
                              : setThumbs(undefined);
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                {props.onCopy && props.onFeedback && props.role === "ai" && (
                  <div
                    style={{
                      borderRightColor: awsui.colorTextInteractiveDefault,
                      borderRightStyle: "solid",
                      borderRightWidth: "0.1em",
                      height: "80%",
                      marginTop: "0.2em",
                    }}
                  />
                )}
                {props.onCopy ? (
                  <CopyWithPopoverButton
                    disabled={props.waiting}
                    onCopy={props.onCopy}
                  />
                ) : (
                  <></>
                )}
              </SpaceBetween>
            </div>
          )}
          {!props.waiting && props.expandableContent && (
            <ExpandableSection variant="footer" headerText="Metadata">
              {props.expandableContent}
            </ExpandableSection>
          )}
        </div>
      )}
    </div>
  );
}

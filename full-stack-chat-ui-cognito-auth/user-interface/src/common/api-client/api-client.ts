import { ChatApiClient } from "./chat-api-client";

export class ApiClient {
  private _chatClient: ChatApiClient | undefined;

  public get chatClient() {
    if (!this._chatClient) {
      this._chatClient = new ChatApiClient();
    }

    return this._chatClient;
  }
}

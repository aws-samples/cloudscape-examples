import { post} from "aws-amplify/api";
import { API_NAME } from "../constants";
import { ApiClientBase } from "./api-client-base";

export class ChatApiClient extends ApiClientBase {
  async chat(message:string): Promise<any> {
    const headers = await this.getHeaders();
    const restOperation = post({
      apiName: API_NAME,
      path: "/chat",
      options: {
        headers,
        body:{
          message: message
        }
      },
    });

    const response = await restOperation.response;
    const data = (await response.body.json()) as any;

    return data;
  }
}

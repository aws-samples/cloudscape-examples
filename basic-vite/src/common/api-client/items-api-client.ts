import { Item } from "../types";
import { Utils } from "../utils";

export class ItemsApiClient {
  async getItems(): Promise<Item[]> {
    await Utils.promiseSetTimeout(1000);

    const retValue: Item[] = [];

    for (let i = 0; i < 150; i++) {
      retValue.push({
        itemId: i.toString(),
        name: `Item ${i}`,
        type: `Type ${i}`,
        status: i % 10 === 0 ? "warning" : i % 15 === 1 ? "error" : "success",
        details: i * 10,
      });
    }

    return retValue;
  }
}

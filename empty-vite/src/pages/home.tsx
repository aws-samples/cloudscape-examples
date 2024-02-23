import { TextContent } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";

export default function HomePage() {
  return (
    <BaseAppLayout
      content={
        <TextContent>
          <h1>Home Page</h1>
        </TextContent>
      }
    />
  );
}

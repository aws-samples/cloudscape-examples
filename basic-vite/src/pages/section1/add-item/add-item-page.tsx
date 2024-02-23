import {
  BreadcrumbGroup,
  Button,
  Container,
  ContentLayout,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useState } from "react";
import { APP_NAME } from "../../../common/constants";
import { useOnFollow } from "../../../common/hooks/use-on-follow";
import BaseAppLayout from "../../../components/base-app-layout";
import RouterButton from "../../../components/wrappers/router-button";

export default function AddItemPage() {
  const onFollow = useOnFollow();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);

  const submitForm = async () => {
    setSubmitting(true);
    setGlobalError("Not implemented yet");
    setSubmitting(false);
  };
  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            {
              text: APP_NAME,
              href: "/",
            },
            {
              text: "Items",
              href: "/section1",
            },
            {
              text: "Add Item",
              href: "/section1/add",
            },
          ]}
          expandAriaLabel="Show path"
          ariaLabel="Breadcrumbs"
        />
      }
      content={
        <ContentLayout
          header={
            <Header variant="h1" description="Add a new item to the list">
              Add Item
            </Header>
          }
        >
          <form onSubmit={(event) => event.preventDefault()}>
            <Form
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <RouterButton variant="link" href="/section1">
                    Cancel
                  </RouterButton>
                  <Button
                    data-testid="create"
                    variant="primary"
                    onClick={submitForm}
                    disabled={submitting}
                  >
                    Add Item
                  </Button>
                </SpaceBetween>
              }
              errorText={globalError}
            >
              <Container
                header={<Header variant="h2">Item Configuration</Header>}
              >
                <SpaceBetween size="l">
                  <FormField label="Item Name">
                    <Input
                      placeholder="My Item"
                      disabled={submitting}
                      value=""
                    />
                  </FormField>
                </SpaceBetween>
              </Container>
            </Form>
          </form>
        </ContentLayout>
      }
    />
  );
}

import {
  Button,
  Header,
  HeaderProps,
  SpaceBetween,
} from "@cloudscape-design/components";
import RouterButton from "../../../components/wrappers/router-button";
import { useNavigate } from "react-router-dom";
import { Item } from "../../../common/types";

interface AllItemsPageHeaderProps extends HeaderProps {
  title?: string;
  createButtonText?: string;
  selectedItems: readonly Item[];
}

export function AllItemsPageHeader({
  title = "Items",
  ...props
}: AllItemsPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <Header
      variant="awsui-h1-sticky"
      actions={
        <SpaceBetween size="xs" direction="horizontal">
          <Button iconName="refresh" />
          <RouterButton
            data-testid="header-btn-view-details"
            disabled={props.selectedItems.length !== 1}
            onClick={() =>
              navigate(`/section1/items/${props.selectedItems[0].itemId}`)
            }
          >
            View
          </RouterButton>
          <RouterButton
            data-testid="header-btn-view-details"
            disabled={props.selectedItems.length !== 1}
          >
            Delete
          </RouterButton>
          <RouterButton
            data-testid="header-btn-create"
            variant="primary"
            href="/section1/add"
          >
            Add Item
          </RouterButton>
        </SpaceBetween>
      }
      {...props}
    >
      {title}
    </Header>
  );
}

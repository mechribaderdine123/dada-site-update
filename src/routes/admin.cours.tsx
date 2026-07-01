import { createFileRoute } from "@tanstack/react-router";
import PageEditor from "@/components/admin/PageEditor";

export const Route = createFileRoute("/admin/cours")({
  component: () => <PageEditor pageId="cours" />,
});

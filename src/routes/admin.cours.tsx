import { createFileRoute } from "@tanstack/react-router";
import PageEditor from "@/components/admin/PageEditor";
import DailyPlansManager from "@/components/admin/DailyPlansManager";

export const Route = createFileRoute("/admin/cours")({
  component: () => (
    <div className="space-y-10">
      <PageEditor pageId="cours" />
      <DailyPlansManager />
    </div>
  ),
});

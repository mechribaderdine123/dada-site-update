import { createFileRoute } from "@tanstack/react-router";
import GymManager from "@/components/admin/GymManager";

export const Route = createFileRoute("/admin/gym")({
  head: () => ({
    meta: [{ title: "Salle de sport — Admin — Dada Hip Hop Academy" }],
  }),
  component: GymManager,
});

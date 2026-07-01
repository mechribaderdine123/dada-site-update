import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dada-reseaux-artist")({
  beforeLoad: () => {
    throw redirect({ to: "/artist" });
  },
});

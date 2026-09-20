import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/artist/music")({ component: MusicRedirect });

// Retains old bookmarks while music management now lives inside the Edit Profile studio.
function MusicRedirect() {
  return <Navigate to="/artist/edit" hash="music" replace />;
}

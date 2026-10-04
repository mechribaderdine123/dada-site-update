import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/artist/my-music")({ component: MyMusicRedirect });

// Retains old bookmarks: music management now lives at the bottom of the Edit Profile page.
function MyMusicRedirect() {
  return <Navigate to="/artist/edit" hash="music" replace />;
}

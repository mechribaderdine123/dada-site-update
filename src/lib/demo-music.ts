import disco1 from "@/assets/disco-1.jpg";
import disco2 from "@/assets/disco-2.jpg";
import disco3 from "@/assets/disco-3.jpg";
import disco4 from "@/assets/disco-4.jpg";
import type { Album, Track } from "./music-store";

export const DEMO_ALBUMS: Album[] = [
  { id: "demo-a1", title: "Midnight Chronicles", year: "2025", cover: disco3, createdAt: 3 },
  { id: "demo-a2", title: "Golden Hours", year: "2024", cover: disco2, createdAt: 2 },
  { id: "demo-a3", title: "Shadow Frequencies", year: "2023", cover: disco1, createdAt: 1 },
];

export const DEMO_TRACKS: Track[] = [
  // Tracks belonging to Midnight Chronicles
  { id: "demo-t1", title: "City Lights", genre: "Hip hop", cover: disco3, albumId: "demo-a1", createdAt: 10 },
  { id: "demo-t2", title: "Velvet Smoke", genre: "Trap", cover: disco3, albumId: "demo-a1", createdAt: 9 },
  { id: "demo-t3", title: "Royal Frequency", genre: "Rap", cover: disco2, albumId: "demo-a2", createdAt: 8 },
  // Singles (no albumId)
  { id: "demo-s1", title: "Late Nights", genre: "R&B", cover: disco4, createdAt: 7 },
  { id: "demo-s2", title: "Concrete Jungle", genre: "Drill", cover: disco1, createdAt: 6 },
  { id: "demo-s3", title: "Neon Dreams", genre: "Trap", cover: disco4, createdAt: 5 },
];

export const DEMO_ALBUM_TRACK_COUNT: Record<string, number> = {
  "demo-a1": 12,
  "demo-a2": 9,
  "demo-a3": 8,
};

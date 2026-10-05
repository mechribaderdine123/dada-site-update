import { supabase } from "@/integrations/supabase/client";

// Uploads a file to the public "site-images" Storage bucket and returns its
// public URL. Used for any image editable from the admin dashboard that must
// be visible to every visitor (page content, sponsors, workshops).
export async function uploadSiteImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data: uploadData, error } = await supabase.storage
    .from("site-images")
    .upload(path, file);
  if (error) throw error;
  // The server may re-encode the image (e.g. PNG → WebP) and returns the true
  // on-disk path. Build the public URL from that path so it matches disk.
  const storedPath = uploadData?.path ?? path;
  const { data } = supabase.storage.from("site-images").getPublicUrl(storedPath);
  return data.publicUrl;
}

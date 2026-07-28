import { supabase } from "@/integrations/supabase/client";

// Uploads a file to the public "site-images" Storage bucket and returns its
// public URL. Used for any image editable from the admin dashboard that must
// be visible to every visitor (page content, sponsors, workshops).
export async function uploadSiteImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("site-images").getPublicUrl(path);
  return data.publicUrl;
}

import "server-only";
import { createClient } from "@/lib/supabase/server";

export type VisionItem = {
  id: string;
  kind: "image" | "words";
  words: string | null;
  caption: string | null;
  url: string | null;
};

/** The member's board, with short-lived signed links for the private images. */
export async function listVisionItems(): Promise<VisionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("vision_items").select("*").order("position").order("created_at");
  if (error) throw new Error(`Could not load your vision board: ${error.message}`);

  const paths = data.filter((i) => i.image_path).map((i) => i.image_path!);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed, error: signError } = await supabase.storage.from("vision").createSignedUrls(paths, 60 * 60);
    if (signError) throw new Error(`Could not load your pictures: ${signError.message}`);
    for (const s of signed) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  return data.map((i) => ({
    id: i.id,
    kind: i.kind,
    words: i.words,
    caption: i.caption,
    url: i.image_path ? urls.get(i.image_path) ?? null : null,
  }));
}

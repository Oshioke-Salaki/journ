import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fromIsoDate } from "@/lib/dates";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Public content, cached on the server for a few minutes and tagged so the admin area can refresh it
 * the moment something changes (`updateTag("content")`).
 */

export type Quote = Tables<"quotes">;
export type Prompt = Tables<"prompts">;
export type Topic = Tables<"topics">;
export type Video = Tables<"videos">;

export async function getQuoteForDay(day: string): Promise<Quote | null> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  const { data, error } = await createPublicClient().rpc("quote_for_day", { day });
  if (error) throw new Error(`Could not load quote: ${error.message}`);
  return data?.[0] ?? null;
}

export async function getPrompts(): Promise<Prompt[]> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  const { data, error } = await createPublicClient()
    .from("prompts")
    .select("*")
    .eq("is_active", true)
    .order("created_at")
    .order("id");
  if (error) throw new Error(`Could not load prompts: ${error.message}`);
  return data;
}

/** The day's general prompt: the same for everyone, rotating daily. */
export async function getPromptForDay(day: string): Promise<Prompt | null> {
  const general = (await getPrompts()).filter((p) => p.topic_slug === null);
  if (!general.length) return null;
  const n = Math.floor(fromIsoDate(day).getTime() / 86_400_000);
  return general[((n % general.length) + general.length) % general.length];
}

export async function getPrompt(id: string): Promise<Prompt | null> {
  return (await getPrompts()).find((p) => p.id === id) ?? null;
}

export async function getTopics(): Promise<Topic[]> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  const { data, error } = await createPublicClient().from("topics").select("*").order("sort");
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return data;
}

export async function getTopic(slug: string): Promise<Topic | null> {
  return (await getTopics()).find((t) => t.slug === slug) ?? null;
}

export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  const { data, error } = await createPublicClient()
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("sort")
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Could not load videos: ${error.message}`);
  return data;
}

export async function getVideo(id: string): Promise<Video | null> {
  return (await getVideos()).find((v) => v.id === id) ?? null;
}

export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

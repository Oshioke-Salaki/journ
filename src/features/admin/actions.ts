"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { promptSchema, quoteSchema, topicSchema, videoSchema, type PromptInput, type QuoteInput, type TopicInput, type VideoInput } from "./schemas";

const uuid = z.uuid();
type Table = "quotes" | "prompts" | "videos";

/** Content is cached for every member; this makes a change visible to them straight away. */
function published() {
  updateTag("content");
  revalidatePath("/admin", "layout");
}

function logged(where: string, error: { code?: string; message: string }) {
  console.error(`[admin] ${where}`, error.code, error.message);
  return fail(UNEXPECTED_ERROR);
}

export async function saveQuote(id: string | null, input: QuoteInput): Promise<ActionResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const supabase = await createClient();
  const row = { body: parsed.data.body, author: parsed.data.author, source: parsed.data.source };
  const { error } = id ? await supabase.from("quotes").update(row).eq("id", id) : await supabase.from("quotes").insert(row);
  if (error) return logged("quote", error);
  published();
  return ok(undefined, id ? "Quote updated" : "Quote added");
}

export async function savePrompt(id: string | null, input: PromptInput): Promise<ActionResult> {
  const parsed = promptSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const supabase = await createClient();
  const row = { body: parsed.data.body, topic_slug: parsed.data.topicSlug };
  const { error } = id ? await supabase.from("prompts").update(row).eq("id", id) : await supabase.from("prompts").insert(row);
  if (error) return logged("prompt", error);
  published();
  return ok(undefined, id ? "Prompt updated" : "Prompt added");
}

export async function saveVideo(id: string | null, input: VideoInput): Promise<ActionResult<{ id: string }>> {
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const v = parsed.data;
  const supabase = await createClient();
  const { data: existing } = id ? await supabase.from("videos").select("published_at").eq("id", id).maybeSingle() : { data: null };
  const row = {
    title: v.title,
    description: v.description,
    topic_slug: v.topicSlug,
    kind: v.kind,
    tier: v.tier,
    duration_seconds: Math.round(v.durationMinutes * 60),
    host_name: v.hostName,
    mux_playback_id: v.muxPlaybackId,
    is_published: v.isPublished,
    published_at: v.isPublished ? (existing?.published_at ?? new Date().toISOString()) : null,
  };
  const { data, error } = id
    ? await supabase.from("videos").update(row).eq("id", id).select("id").single()
    : await supabase.from("videos").insert(row).select("id").single();
  if (error) return logged("video", error);
  published();
  return ok({ id: data.id }, id ? "Video saved" : "Video added");
}

export async function setActive(table: Table, id: string, active: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(id).success || !["quotes", "prompts", "videos"].includes(table)) return fail(UNEXPECTED_ERROR);
  await requireAdmin();
  const supabase = await createClient();
  const { error } =
    table === "videos"
      ? await supabase.from("videos").update({ is_published: active, published_at: active ? new Date().toISOString() : null }).eq("id", id)
      : await supabase.from(table).update({ is_active: active }).eq("id", id);
  if (error) return logged("active", error);
  published();
  return ok(undefined, active ? "Now live for members" : "Hidden from members");
}

export async function deleteContent(table: Table, id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success || !["quotes", "prompts", "videos"].includes(table)) return fail(UNEXPECTED_ERROR);
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return logged("delete", error);
  published();
  return ok(undefined, "Deleted");
}

export async function saveTopic(slug: string, input: TopicInput): Promise<ActionResult> {
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("topics")
    .update({ title: parsed.data.title, summary: parsed.data.summary, is_mature: parsed.data.isMature })
    .eq("slug", slug);
  if (error) return logged("topic", error);
  published();
  return ok(undefined, "Topic saved");
}

const TEAM_MESSAGES: Record<string, string> = {
  not_found: "No JournApp account uses that email. Ask them to sign up first.",
  self: "You can't remove yourself. Ask another admin to do it.",
  last_admin: "JournApp needs at least one admin.",
};

/** Adds or removes an admin. The database enforces who may do this and the safety rules. */
export async function setAdmin(email: string, makeAdmin: boolean): Promise<ActionResult> {
  const parsed = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")).safeParse(email);
  if (!parsed.success) return fail(parsed.error.issues[0].message, { email: [parsed.error.issues[0].message] });
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_role", { target_email: parsed.data, make_admin: makeAdmin });
  if (error) return logged("team", error);
  if (data !== "ok") return fail(TEAM_MESSAGES[data] ?? UNEXPECTED_ERROR);
  revalidatePath("/admin/team");
  return ok(undefined, makeAdmin ? "Admin added" : "Admin removed");
}

/** Removes a member's authenticator app after they lost it, so they can sign in with a password. */
export async function resetTwoStep(email: string): Promise<ActionResult> {
  const parsed = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")).safeParse(email);
  if (!parsed.success) return fail(parsed.error.issues[0].message, { email: [parsed.error.issues[0].message] });
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_reset_two_step", { target_email: parsed.data });
  if (error) return logged("two-step", error);
  if (data === "not_found") return fail("No account uses that email.", { email: ["No account uses that email."] });
  if (data === "none") return fail("That account doesn't use two-step sign-in.");
  return ok(undefined, "Two-step sign-in reset");
}

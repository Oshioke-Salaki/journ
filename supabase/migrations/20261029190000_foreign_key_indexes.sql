-- Indexes for foreign keys the Supabase performance advisor flags, so joins and cascading deletes
-- stay fast as the member base grows.
create index if not exists journal_entries_prompt_idx on public.journal_entries (prompt_id) where prompt_id is not null;
create index if not exists prompts_topic_idx on public.prompts (topic_slug);
create index if not exists goal_steps_user_idx on public.goal_steps (user_id);
create index if not exists control_items_step_idx on public.control_items (goal_step_id) where goal_step_id is not null;
create index if not exists videos_topic_all_idx on public.videos (topic_slug);

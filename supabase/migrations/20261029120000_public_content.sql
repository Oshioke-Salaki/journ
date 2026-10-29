-- Content is the same for every member and holds nothing private, so it is readable without a
-- session. This lets the app cache it on the server and show topics on the public welcome page.
-- Premium video playback stays protected separately (signed playback, planned).

create policy "Anyone reads topics" on public.topics for select to anon using (true);
create policy "Anyone reads active prompts" on public.prompts for select to anon using (is_active);
create policy "Anyone reads active quotes" on public.quotes for select to anon using (is_active);
create policy "Anyone reads published videos" on public.videos for select to anon using (is_published);

grant execute on function public.quote_for_day(date) to anon;

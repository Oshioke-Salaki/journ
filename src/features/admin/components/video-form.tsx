"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Description, Field, Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { applyFieldErrors } from "@/lib/forms";
import { notify } from "@/lib/notify";
import { saveVideo } from "../actions";
import { videoSchema, type VideoInput } from "../schemas";

export function VideoForm({ id, defaults, topics }: { id?: string; defaults: VideoInput; topics: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<VideoInput>({ resolver: zodResolver(videoSchema), defaultValues: defaults, mode: "onTouched" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveVideo(id ?? null, values);
      if (!result.ok) {
        applyFieldErrors(form, result);
        return void notify.error(result.error);
      }
      notify.success(result.message ?? "Saved");
      router.replace("/admin/videos");
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-[720px] flex-col gap-6">
      <Field error={errors.title?.message}>
        <Label>Title</Label>
        <Input {...form.register("title")} />
      </Field>
      <Field error={errors.description?.message}>
        <Label>Description</Label>
        <Textarea rows={4} {...form.register("description")} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <Label>Topic</Label>
          <Select {...form.register("topicSlug")}>
            <option value="">No topic (shown in Discover)</option>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Type</Label>
          <Select {...form.register("kind")}>
            <option value="lesson">Lesson</option>
            <option value="practice">Practice</option>
            <option value="coaching_session">Coaching session</option>
          </Select>
        </Field>
        <Field>
          <Label>Access</Label>
          <Select {...form.register("tier")}>
            <option value="free">Free for everyone</option>
            <option value="premium">Premium</option>
          </Select>
        </Field>
        <Field error={errors.durationMinutes?.message}>
          <Label>Length in minutes</Label>
          <Input type="number" inputMode="numeric" min={1} max={600} {...form.register("durationMinutes")} />
        </Field>
      </div>
      <Field error={errors.hostName?.message}>
        <Label optional>Presenter or coach</Label>
        <Input {...form.register("hostName")} />
      </Field>
      <Field error={errors.muxPlaybackId?.message}>
        <Label optional>Mux playback ID</Label>
        <Description>From the Mux dashboard, after uploading the video. Until this is set, members see that the video is on its way.</Description>
        <Input described spellCheck={false} autoCapitalize="none" {...form.register("muxPlaybackId")} />
      </Field>
      <div className="flex items-center justify-between gap-4 rounded-[16px] bg-raised px-4 py-4">
        <label htmlFor="published" className="flex flex-col">
          <span className="text-[15px] font-medium text-ink">Published</span>
          <span className="text-[14px] text-muted">Visible to members in Discover and Community.</span>
        </label>
        <Controller control={form.control} name="isPublished" render={({ field }) => <Switch id="published" checked={field.value} onCheckedChange={field.onChange} />} />
      </div>
      <div className="flex justify-end gap-2 border-t border-rule pt-6">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {id ? "Save video" : "Add video"}
        </Button>
      </div>
    </form>
  );
}

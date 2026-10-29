"use client";

import { Play } from "lucide-react";
import { Landscape } from "@/components/brand/landscape";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/** The welcome video from the sketch. A placeholder until the video is recorded. */
export function IntroVideo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg">
          <Play className="fill-current" aria-hidden />
          Watch the introduction
        </Button>
      </DialogTrigger>
      <DialogContent title="Welcome to JournApp" description="A two-minute introduction to how JournApp works." className="sm:max-w-[640px]">
        <div className="relative overflow-hidden rounded-[18px]">
          <Landscape mood={4} energy={3} seed={21} radius={0} className="aspect-video" />
          <p className="absolute inset-x-3 bottom-3 rounded-[12px] bg-white/90 px-4 py-3 text-[14px] text-[#15302e]">
            The introduction video is being recorded and will play here soon.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

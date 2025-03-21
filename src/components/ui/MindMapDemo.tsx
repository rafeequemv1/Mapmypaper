
"use client";

import React, { forwardRef, useRef } from "react";
import { Brain, FileText, Upload, Sparkles, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function MindMapDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background p-10 md:shadow-xl"
      ref={containerRef}
    >
      <div className="flex size-full flex-col max-w-lg max-h-[380px] items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <Brain className="text-indigo-600" />
          </Circle>
          <Circle ref={div5Ref}>
            <FileText className="text-purple-600" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <Upload className="text-pink-600" />
          </Circle>
          <Circle ref={div4Ref} className="size-16 bg-gradient-to-br from-indigo-500 to-purple-500">
            <Brain className="text-white h-8 w-8" />
          </Circle>
          <Circle ref={div6Ref}>
            <Sparkles className="text-amber-500" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref}>
            <ArrowRight className="text-green-600" />
          </Circle>
          <Circle ref={div7Ref}>
            <FileText className="text-blue-600" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        gradientStartColor="#818cf8"
        gradientStopColor="#a78bfa"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
        gradientStartColor="#f472b6"
        gradientStopColor="#c084fc"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        gradientStartColor="#4ade80"
        gradientStopColor="#22d3ee"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
        gradientStartColor="#f97316"
        gradientStopColor="#ec4899"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
        gradientStartColor="#facc15"
        gradientStopColor="#f43f5e"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
        gradientStartColor="#3b82f6"
        gradientStopColor="#8b5cf6"
      />
    </div>
  );
}

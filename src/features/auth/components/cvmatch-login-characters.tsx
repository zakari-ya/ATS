"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Point = {
  x: number;
  y: number;
};

type EyeProps = {
  mousePosition: Point;
  className?: string;
  blinkDelay?: string;
};

type CharacterProps = {
  mousePosition: Point;
  className?: string;
  bodyClassName: string;
  accentClassName: string;
  eyeTone?: "dark" | "light";
  blinkDelay?: string;
};

function Eye({
  mousePosition,
  className,
  blinkDelay = "0s",
}: EyeProps) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (!eyeRef.current) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const rect = eyeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = mousePosition.x - centerX;
    const deltaY = mousePosition.y - centerY;
    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.min(5, Math.hypot(deltaX, deltaY) / 18);

    setOffset({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }, [mousePosition]);

  return (
    <span
      ref={eyeRef}
      className={cn(
        "cvmatch-login-eye flex size-9 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,63,58,0.08)]",
        className
      )}
      style={{ animationDelay: blinkDelay }}
      aria-hidden="true"
    >
      <span
        className="size-3 rounded-full bg-[#183f3a] transition-transform duration-75 ease-out"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      />
    </span>
  );
}

function Character({
  mousePosition,
  className,
  bodyClassName,
  accentClassName,
  eyeTone = "dark",
  blinkDelay = "0s",
}: CharacterProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-[0.78] w-28 items-center justify-center rounded-[2.25rem] shadow-[0_30px_80px_-44px_rgba(24,63,58,0.65)]",
        bodyClassName,
        className
      )}
      aria-hidden="true"
    >
      <div className={cn("absolute -top-3 size-10 rounded-full", accentClassName)} />
      <div className="absolute inset-x-5 top-8 flex justify-between">
        <Eye
          mousePosition={mousePosition}
          blinkDelay={blinkDelay}
          className={eyeTone === "light" ? "bg-[#183f3a]/88" : undefined}
        />
        <Eye
          mousePosition={mousePosition}
          blinkDelay={blinkDelay}
          className={eyeTone === "light" ? "bg-[#183f3a]/88" : undefined}
        />
      </div>
      <div className="absolute bottom-8 h-2 w-12 rounded-full bg-current opacity-20" />
    </div>
  );
}

export function CvMatchLoginCharacters() {
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-[25rem] overflow-hidden rounded-[2rem] border border-[#1f4d47]/10 bg-[#e9f1ee]/76 p-6 shadow-[0_30px_90px_-60px_rgba(24,63,58,0.8)] backdrop-blur sm:min-h-[29rem] sm:p-8 lg:min-h-[42rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.82),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(169,199,193,0.46),transparent_28%)]" />
      <div className="absolute -bottom-20 left-1/2 h-52 w-[115%] -translate-x-1/2 rounded-[50%] bg-[#183f3a]/10 blur-2xl" />
      <div className="relative flex h-full min-h-[21rem] items-end justify-center gap-3 sm:min-h-[24rem] sm:gap-5 lg:min-h-[36rem]">
        <Character
          mousePosition={mousePosition}
          bodyClassName="bg-[#183f3a] text-white"
          accentClassName="bg-[#a9c7c1]"
          className="mb-10 rotate-[-7deg] scale-95"
          blinkDelay="0s"
        />
        <Character
          mousePosition={mousePosition}
          bodyClassName="bg-[#f9f6ee] text-[#183f3a]"
          accentClassName="bg-[#183f3a]"
          className="z-10 mb-20 scale-110"
          blinkDelay="1.15s"
        />
        <Character
          mousePosition={mousePosition}
          bodyClassName="bg-[#c9ded8] text-[#183f3a]"
          accentClassName="bg-white"
          className="mb-8 rotate-[7deg] scale-95"
          blinkDelay="2.25s"
        />
      </div>
      <div className="relative mt-6 max-w-sm">
        <p className="text-sm uppercase tracking-[0.22em] text-[#66736f]">
          Private CV workspace
        </p>
        <h2 className="mt-3 text-3xl leading-none tracking-tight text-[#183f3a] sm:text-4xl">
          Your match review, connected to your account.
        </h2>
      </div>
    </div>
  );
}

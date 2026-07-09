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
        "cvmatch-login-eye flex size-7 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,63,58,0.08)] sm:size-8 lg:size-9",
        className
      )}
      style={{ animationDelay: blinkDelay }}
      aria-hidden="true"
    >
      <span
        className="size-2.5 rounded-full bg-[#183f3a] transition-transform duration-75 ease-out sm:size-3"
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
        "relative flex aspect-[0.78] w-20 items-center justify-center rounded-[1.6rem] shadow-[0_30px_80px_-44px_rgba(24,63,58,0.65)] sm:w-24 sm:rounded-[2rem] lg:w-28 lg:rounded-[2.25rem]",
        bodyClassName,
        className
      )}
      aria-hidden="true"
    >
      <div className={cn("absolute -top-2 size-7 rounded-full sm:-top-3 sm:size-9 lg:size-10", accentClassName)} />
      <div className="absolute inset-x-3 top-5 flex justify-between sm:inset-x-4 sm:top-6 lg:inset-x-5 lg:top-8">
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
      <div className="absolute bottom-6 h-1.5 w-8 rounded-full bg-current opacity-20 sm:bottom-7 sm:w-10 lg:bottom-8 lg:w-12" />
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
    <div className="relative min-h-[15rem] overflow-hidden rounded-[1.8rem] border border-[#1f4d47]/10 bg-[#e9f1ee]/76 p-4 shadow-[0_30px_90px_-60px_rgba(24,63,58,0.8)] backdrop-blur sm:min-h-[18rem] sm:p-5 lg:min-h-[42rem] lg:rounded-[2rem] lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.82),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(169,199,193,0.46),transparent_28%)]" />
      <div className="absolute -bottom-14 left-1/2 h-32 w-[120%] -translate-x-1/2 rounded-[50%] bg-[#183f3a]/10 blur-2xl sm:h-40 lg:-bottom-20 lg:h-52 lg:w-[115%]" />
      <div className="relative flex h-full min-h-[10rem] items-end justify-center gap-2 sm:min-h-[12rem] sm:gap-3 lg:min-h-[36rem] lg:gap-5">
        <Character
          mousePosition={mousePosition}
          bodyClassName="bg-[#183f3a] text-white"
          accentClassName="bg-[#a9c7c1]"
          className="mb-3 rotate-[-7deg] scale-95 sm:mb-4 lg:mb-10"
          blinkDelay="0s"
        />
        <Character
          mousePosition={mousePosition}
          bodyClassName="bg-[#f9f6ee] text-[#183f3a]"
          accentClassName="bg-[#183f3a]"
          className="z-10 mb-7 scale-105 sm:mb-9 lg:mb-20 lg:scale-110"
          blinkDelay="1.15s"
        />
        <Character
          mousePosition={mousePosition}
          bodyClassName="bg-[#c9ded8] text-[#183f3a]"
          accentClassName="bg-white"
          className="mb-2 rotate-[7deg] scale-95 sm:mb-3 lg:mb-8"
          blinkDelay="2.25s"
        />
      </div>
      <div className="relative mt-3 max-w-sm sm:mt-4 lg:mt-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#66736f] sm:text-xs sm:tracking-[0.22em]">
          Private CV workspace
        </p>
        <h2 className="mt-2 text-[1.75rem] leading-none tracking-tight text-[#183f3a] sm:mt-3 sm:text-[2rem] lg:text-4xl">
          Your match review, connected to your account.
        </h2>
      </div>
    </div>
  );
}

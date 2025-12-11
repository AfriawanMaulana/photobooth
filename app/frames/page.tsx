"use client";
import Image from "next/image";
import dataFrame from "./data-frame.json";
import Link from "next/link";
import { useEffect } from "react";

type Frame = {
  id: number;
  name: string;
  description: string;
  frameUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  maxCaptures: number;
  banner: string;
  position: Array<{
    id: number;
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
};

export default function Page() {
  useEffect(() => {
    localStorage.removeItem("frameConfig");
  }, []);

  const handleSelectFrame = (frame: Frame) => {
    const frameConfig = {
      id: frame.id,
      name: frame.name,
      description: frame.description,
      frameUrl: frame.frameUrl,
      canvasWidth: frame.canvasWidth,
      canvasHeight: frame.canvasHeight,
      maxCaptures: frame.maxCaptures,
      position: frame.position, // Jangan lupa simpan position juga!
    };

    localStorage.setItem("frameConfig", JSON.stringify(frameConfig));
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background/20 p-4">
      <h1 className="text-center text-2xl md:text-3xl mb-4 text-background font-black font-mono">
        Pilih Frame Terbaikmu
      </h1>
      <div className="flex flex-wrap gap-2 md:gap-5 lg:gap-8">
        {dataFrame.custom.map((frame) => (
          <Link
            key={frame.id}
            href="/take-photo"
            onClick={() => handleSelectFrame(frame)}
            className="flex flex-col space-y-2 w-52 p-4 items-center justify-center shadow-md shadow-black/5 rounded-lg bg-white hover:border-2 hover:border-border hover:-translate-y-2 transition-transform ease-in-out duration-200"
          >
            <Image
              src={frame.banner}
              alt={frame.name || "Frame preview"}
              width={150}
              height={150}
              className="w-full h-auto"
            />
            <h2 className="font-semibold text-[10px]">{frame.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}

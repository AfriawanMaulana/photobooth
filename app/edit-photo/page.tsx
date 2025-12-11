"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Download } from "lucide-react";

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getFrame = () => {
      const frameConfig = localStorage.getItem("frameConfig");
      if (frameConfig) {
        setFrame(JSON.parse(frameConfig));
      }
    };
    const getPhotos = () => {
      const storedPhotos = localStorage.getItem("capturedPhotos");
      if (storedPhotos) {
        setPhotos(JSON.parse(storedPhotos));
      }
    };
    getFrame();
    getPhotos();
  }, []);

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsDownloading(true);

    try {
      // Import html2canvas dinamis
      const html2canvas = (await import("html2canvas")).default;

      // Render canvas element ke image
      const canvas = await html2canvas(canvasRef.current, {
        scale: 4, // Kualitas tinggi (4x resolusi)
        useCORS: true, // Untuk load gambar dari URL berbeda
        backgroundColor: null,
        logging: false,
      });

      // Convert ke blob dan download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `photobooth-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Gagal mengunduh gambar");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-border/20 p-10 md:p-20 gap-6">
      <h1 className="font-bold text-2xl">Preview</h1>

      <div className="flex w-full h-auto items-center justify-center p-4 bg-white rounded-3xl">
        <div
          ref={canvasRef}
          className="canvas relative shadow"
          style={{ width: 270, height: 480 }}
        >
          {/* FRAME */}
          {frame && (
            <Image
              src={frame.frameUrl}
              alt=""
              fill
              className="absolute top-0 left-0 z-10 pointer-events-none"
            />
          )}

          {/* PHOTOS */}
          {frame?.position?.map((pos, i) => {
            const scaleX = frame.canvasWidth / frame.canvasWidth;
            const scaleY = frame.canvasHeight / frame.canvasHeight;

            const w = pos.width * scaleX;
            const h = pos.height * scaleY;
            const x = pos.left * scaleX;
            const y = pos.top * scaleY;

            return (
              photos[i] && (
                <div
                  key={i}
                  className="absolute overflow-hidden z-0"
                  style={{
                    width: w,
                    height: h,
                    top: y,
                    left: x,
                  }}
                >
                  <Image
                    src={photos[i]}
                    alt=""
                    fill
                    className="object-cover object-center"
                  />
                </div>
              )
            );
          })}
        </div>
      </div>

      {/* TOMBOL DOWNLOAD */}
      <button
        onClick={handleDownload}
        disabled={isDownloading || photos.length === 0}
        className="flex items-center gap-2 px-6 py-3 bg-border hover:bg-background disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
      >
        <Download size={20} />
        {isDownloading ? "Mengunduh..." : "Download Foto"}
      </button>
    </div>
  );
}

"use client";
import Image from "next/image";
import slugify from "slugify";
import { useEffect, useState, useRef } from "react";
import { Download } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
  const [isMono, setIsMono] = useState(false);
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
    if (!canvasRef.current || !frame) return;

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

      const scale = 4;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Grayscale effect
      if (isMono) {
        frame.position.forEach((pos, i) => {
          if (!photos[i]) return;

          const x = pos.left * scale;
          const y = pos.top * scale;
          const w = pos.width * scale;
          const h = pos.height * scale;

          const imageData = ctx.getImageData(x, y, w, h);
          const data = imageData.data;
          for (let j = 0; j < data.length; j += 4) {
            const avg =
              data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114;
            data[j] = data[j + 1] = data[j + 2] = avg;
          }
          ctx.putImageData(imageData, x, y);
        });
      }

      // Convert ke blob dan download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `framebox-${slugify(frame.name, {
            lower: true,
          })}-${Date.now()}.png`;
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

  // Download All Photos
  const downloadAllPhotos = async () => {
    if (!photos.length) return;

    const zip = new JSZip();

    await Promise.all(
      photos.map(async (photos, i) => {
        const res = await fetch(photos);
        const blob = await res.blob();
        zip.file(`framebox-${i + 1}.png`, blob);
      })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "framebox-photos.zip");
  };

  const canvasW = (frame && frame?.canvasWidth / 4) || 270;
  const canvasH = (frame && frame?.canvasHeight / 4) || 480;

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-border/20 p-10 md:p-20 gap-6">
      <h1 className="font-bold text-2xl">Preview</h1>

      <div className="flex flex-col gap-5 md:gap-10 w-full h-auto items-center justify-center p-4 bg-white rounded-3xl">
        <div
          ref={canvasRef}
          className="canvas relative shadow"
          style={{ width: canvasW, height: canvasH }}
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
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundImage: `url(${photos[i]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      filter: isMono ? "grayscale(100%)" : "none",
                    }}
                  />
                </div>
              )
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2>Filters</h2>
          <button
            className={`${
              isMono ? "bg-slate-100" : "bg-white"
            } py-2 px-6 rounded-full shadow shadow-black/10 cursor-pointer`}
            onClick={() => setIsMono(!isMono)}
          >
            mono
          </button>
        </div>
      </div>

      {/* TOMBOL DOWNLOAD */}
      <button
        onClick={downloadAllPhotos}
        disabled={isDownloading || photos.length === 0}
        className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-black/50 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
      >
        <Download size={20} />
        {isDownloading ? "Mengunduh..." : "Download Semua Foto"}
      </button>

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

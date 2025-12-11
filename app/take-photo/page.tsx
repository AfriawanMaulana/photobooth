"use client";
import { ArrowLeft, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

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
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

export default function Page() {
  const webcamRef = useRef<Webcam>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [delay, setDelay] = useState<number>(3);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countDown, setCountDown] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [frame, setFrame] = useState<Frame | null>(null);

  const handleActivateCamera = () => {
    setIsCamera(!isCamera);
  };

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const capture = useCallback(async () => {
    if (!frame) return;
    if (countDown !== null) return;

    setIsCapturing(true);
    for (let i = 0; i < frame.maxCaptures; i++) {
      // Countdown
      for (let sec = delay; sec > 0; sec--) {
        setCountDown(sec);
        await wait(1000);
      }

      // Ambil foto
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        setPhotos((prev) => {
          const updated = [...prev, imageSrc];
          localStorage.setItem("capturedPhotos", JSON.stringify(updated));
          return updated;
        });
      }

      setCountDown(null);
      if (i + 1 === frame.maxCaptures) break;

      await wait(1000);
    }
    setIsCapturing(false);
  }, [frame, delay, countDown]);

  // Remove photos when page mount
  useEffect(() => {
    localStorage.removeItem("capturedPhotos");
  }, []);

  // Get photos from localstorage
  useEffect(() => {
    const getPhotos = () => {
      const storedPhotos = localStorage.getItem("capturedPhotos");
      if (!photos.length && storedPhotos) {
        setPhotos(JSON.parse(storedPhotos));
      }
    };

    // Get frames config from localStorage
    const getFrameConfig = () => {
      const frameConfig = localStorage.getItem("frameConfig");
      if (frameConfig) {
        setFrame(JSON.parse(frameConfig));
      }
    };
    getPhotos();
    getFrameConfig();
  }, [photos]);

  return (
    <div className="flex w-full min-h-screen bg-background/20 p-10 md:p-20">
      <div className="flex flex-col relative space-y-2 w-full h-auto items-center p-10 bg-white/50 rounded-4xl">
        <Link
          href={"/frames"}
          className="inline-flex gap-2 absolute left-4 md:left-12 text-sm items-center px-8 py-2 rounded-full shadow shadow-black/10 bg-white"
        >
          <ArrowLeft size={20} />
          Kembali
        </Link>

        <h1 className="font-bold mt-14 md:mt-0 text-xl text-center">
          Pilih momen berhargamu bersama Terbooth
        </h1>

        {/* Button Camera */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <p className="py-2 px-6 rounded-full bg-white shadow shadow-black/10">
            {photos.length} / {frame?.maxCaptures}
          </p>
          {isCamera && (
            <div className="flex items-center gap-2">
              <label>Timer:</label>
              <select
                id="delay"
                name="delay"
                onChange={(e) => setDelay(Number(e.currentTarget.value))}
                className="py-2 px-6 rounded-full bg-white shadow shadow-black/10"
              >
                <option value={3}>3 detik</option>
                <option value={5}>5 detik</option>
                <option value={10}>10 detik</option>
              </select>
            </div>
          )}
          <button
            className="py-2 px-6 rounded-full bg-white shadow shadow-black/10"
            onClick={handleActivateCamera}
          >
            {isCamera ? "Stop Camera" : "Camera"}
          </button>
        </div>

        {/* Camera */}
        <div className="bg-white flex flex-col items-center justify-center w-[340px] md:w-[640px] h-[460px] rounded-3xl relative">
          {isCamera ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full rounded-3xl object-cover"
              videoConstraints={{ aspectRatio: 4 / 3, facingMode: "user" }}
            />
          ) : (
            <>
              <h2 className="font-semibold text-xl text-slate-400 flex flex-col items-center">
                <Camera size={60} /> Kamera belum aktif
              </h2>
              <p className="text-slate-400">
                aktifkan kamera untuk melanjutkan
              </p>
            </>
          )}
          {countDown !== null && (
            <h1 className="absolute text-6xl font-black text-white drop-shadow-lg">
              {countDown}
            </h1>
          )}
        </div>

        {/* Button Take Photo */}
        {photos.length < Number(frame?.maxCaptures) && (
          <div>
            {isCamera ? (
              <button
                onClick={capture}
                disabled={isCapturing}
                className="px-20 py-2 text-white font-semibold bg-border rounded-full disabled:bg-border/25 disabled:cursor-not-allowed"
              >
                {isCapturing ? "Capturing..." : "Capture"}
              </button>
            ) : (
              <button
                className="px-20 py-2 text-white font-semibold bg-slate-400 rounded-full cursor-not-allowed"
                disabled
              >
                Aktifkan Kamera
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col items-center space-y-2">
          <div
            className={`grid ${
              Number(frame?.maxCaptures) === 4
                ? "grid-cols-2"
                : "md:grid-cols-3"
            } gap-1 h-auto items-center bg-background/70 rounded-2xl p-2`}
          >
            {photos.map((photo, index) => (
              <Image
                key={index}
                src={photo}
                alt={`Saved photo ${index + 1}`}
                width={150}
                height={200}
                className="object-contain rounded-lg"
              />
            ))}
          </div>
          {photos.length === Number(frame?.maxCaptures) && (
            <Link
              href={"/edit-photo"}
              className="flex items-center gap-2 px-14 py-2 bg-border hover:bg-background disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

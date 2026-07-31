"use client";
import { ArrowLeft, Camera, FlipHorizontal2, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import NameInputModal from "../components/NameInput";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const cameraBoxRef = useRef<HTMLDivElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [delay, setDelay] = useState<number>(3);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [countDown, setCountDown] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [guideBoxSize, setGuideBoxSize] = useState({ width: 0, height: 0 });
  const [userName, setUserName] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 1. Load frame configuration & existing photos pada saat awal mount
  useEffect(() => {
    // Clear foto lama dari pencarian sebelumnya saat halaman pertama kali dibuka
    localStorage.removeItem("capturedPhotos");

    const frameConfig = localStorage.getItem("frameConfig");
    if (frameConfig) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFrame(JSON.parse(frameConfig));
      } catch (err) {
        console.error("Gagal membaca frameConfig:", err);
      }
    }
  }, []);

  // 2. Hitung Rasio Slot Foto (Default 3/4 Potret)
  const slotAspectRatio = useMemo(() => {
    const firstSlot = frame?.position?.[0];
    if (!firstSlot || !firstSlot.width || !firstSlot.height) return 3 / 4;
    return firstSlot.width / firstSlot.height;
  }, [frame]);

  // 3. Ideal Capture Resolution Target
  const TARGET_LONG_EDGE = 1920;
  const captureResolution = useMemo(() => {
    if (slotAspectRatio >= 1) {
      const width = TARGET_LONG_EDGE;
      const height = Math.round(TARGET_LONG_EDGE / slotAspectRatio);
      return { width, height };
    }
    const height = TARGET_LONG_EDGE;
    const width = Math.round(TARGET_LONG_EDGE * slotAspectRatio);
    return { width, height };
  }, [slotAspectRatio]);

  // 4. Update Guide Box Overlay secara responsif
  useEffect(() => {
    const el = cameraBoxRef.current;
    if (!el) return;

    const updateGuideSize = () => {
      const rect = el.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      if (!cw || !ch) return;

      const containerRatio = cw / ch;
      let w: number;
      let h: number;

      if (slotAspectRatio > containerRatio) {
        w = cw;
        h = w / slotAspectRatio;
      } else {
        h = ch;
        w = h * slotAspectRatio;
      }

      setGuideBoxSize({ width: w, height: h });
    };

    updateGuideSize();
    const ro = new ResizeObserver(updateGuideSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slotAspectRatio]);

  // 5. Sound Shutter dengan Pembersihan Memory AudioContext
  const playShutterSound = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = 1000;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.08);

      // Otomatis menutup AudioContext setelah suara selesai
      setTimeout(() => {
        ctx.close();
      }, 100);
    } catch {
      // Browser memblokir autopolicy audio
    }
  }, []);

  const triggerShutterEffect = useCallback(() => {
    playShutterSound();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 180);
  }, [playShutterSound]);

  const handleActivateCamera = () => {
    setIsCamera((prev) => !prev);
  };

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // 6. Alur Capture Otomatis (Perbaikan Race-Condition & Stale State)
  const capture = useCallback(async () => {
    if (!frame || isCapturing || countDown !== null) return;

    setIsCapturing(true);
    const capturedSessionPhotos: string[] = [];

    for (let i = 0; i < frame.maxCaptures; i++) {
      // Jeda hitung mundur
      for (let sec = delay; sec > 0; sec--) {
        setCountDown(sec);
        await wait(1000);
      }

      setCountDown(null);

      // Ambil Tangkapan Kamera
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        triggerShutterEffect();
        capturedSessionPhotos.push(imageSrc);

        // Update state realtime per foto yang terambil
        setPhotos([...capturedSessionPhotos]);
        localStorage.setItem(
          "capturedPhotos",
          JSON.stringify(capturedSessionPhotos)
        );
      }

      // Beri jeda antar foto jika belum foto terakhir
      if (i + 1 < frame.maxCaptures) {
        await wait(1200);
      }
    }

    setIsCapturing(false);
  }, [frame, isCapturing, countDown, delay, triggerShutterEffect]);

  // Reset Foto untuk Ulangi Sesi
  const handleResetPhotos = () => {
    setPhotos([]);
    localStorage.removeItem("capturedPhotos");
  };

  const handleSaveName = (name: string) => {
    setUserName(name);
    localStorage.setItem("framebox-username", name);
    router.push("/edit-photo");
  };

  return (
    <div className="flex w-full min-h-screen bg-background/20 p-6 md:p-12 lg:p-20">
      <div className="flex flex-col relative space-y-4 w-full h-auto items-center p-6 md:p-10 bg-white/50 backdrop-blur-md rounded-4xl border border-white/40 shadow-xl">
        {/* Navigation Back */}
        <Link
          href={"/frames"}
          className="inline-flex gap-2 absolute left-4 md:left-8 top-6 text-sm items-center px-6 py-2 rounded-full shadow-sm bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

        <h1 className="font-bold mt-12 md:mt-0 text-xl md:text-2xl text-center text-slate-800">
          Pilih momen berhargamu bersama Terbooth
        </h1>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="py-2 px-5 rounded-full bg-white shadow-sm text-sm font-medium text-slate-700">
            {photos.length} / {frame?.maxCaptures || 0} Foto
          </p>

          {isCamera && (
            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <label htmlFor="delay">Timer:</label>
              <select
                id="delay"
                name="delay"
                disabled={isCapturing}
                onChange={(e) => setDelay(Number(e.currentTarget.value))}
                value={delay}
                className="py-2 px-4 rounded-full bg-white shadow-sm border-none cursor-pointer text-sm outline-none disabled:opacity-50"
              >
                <option value={1}>1 detik</option>
                <option value={3}>3 detik</option>
                <option value={5}>5 detik</option>
                <option value={10}>10 detik</option>
              </select>
            </div>
          )}

          <button
            disabled={isCapturing}
            className="py-2 px-5 flex rounded-full items-center bg-white shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 transition-colors"
            onClick={handleActivateCamera}
          >
            {isCamera ? (
              <span>Matikan Kamera</span>
            ) : (
              <span className="inline-flex gap-2 items-center">
                <Camera size={18} />
                Aktifkan Kamera
              </span>
            )}
          </button>

          <button
            disabled={isCapturing}
            className={`${
              isMirrored ? "bg-slate-200" : "bg-white"
            } py-2 px-4 rounded-full shadow-sm cursor-pointer hover:bg-slate-100 disabled:opacity-50 transition-colors`}
            onClick={() => setIsMirrored(!isMirrored)}
            title="Cermin Kamera"
          >
            <FlipHorizontal2 size={18} />
          </button>
        </div>

        {/* Viewport Viewfinder Kamera */}
        <div
          ref={cameraBoxRef}
          className="bg-slate-400/20 flex flex-col items-center justify-center w-full max-w-[740px] h-[300px] md:h-[460px] rounded-3xl relative overflow-hidden shadow-inner"
        >
          {isCamera ? (
            <Webcam
              ref={webcamRef}
              mirrored={!isMirrored}
              screenshotFormat="image/jpeg"
              className="w-full h-full rounded-3xl object-cover"
              imageSmoothing
              screenshotQuality={0.95}
              videoConstraints={{
                aspectRatio: slotAspectRatio,
                facingMode: "user",
                width: { ideal: captureResolution.width },
                height: { ideal: captureResolution.height },
              }}
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 gap-2">
              <Camera size={56} className="stroke-1" />
              <h2 className="font-semibold text-lg">Kamera Belum Aktif</h2>
              <p className="text-xs text-slate-500">
                Tekan tombol &apos;Aktifkan Kamera&apos; untuk mulai
              </p>
            </div>
          )}

          {/* Guide Overlay Masking */}
          {isCamera && guideBoxSize.width > 0 && (
            <div
              className="absolute pointer-events-none border-2 border-white/80 rounded-lg transition-all"
              style={{
                width: guideBoxSize.width,
                height: guideBoxSize.height,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
              }}
            />
          )}

          {/* Hitung Mundur Text */}
          {countDown !== null && (
            <h1 className="absolute text-7xl font-black text-white drop-shadow-2xl z-10 animate-ping">
              {countDown}
            </h1>
          )}

          {/* Flash Shutter Effect */}
          <div
            className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-150 ${
              isFlashing ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Action Button (Capture / Re-take) */}
        <div className="flex items-center gap-3">
          {photos.length < Number(frame?.maxCaptures || 0) ? (
            <button
              onClick={capture}
              disabled={!isCamera || isCapturing}
              className="px-12 py-3 text-white font-semibold bg-border/80 hover:bg-border disabled:bg-slate-400 disabled:cursor-not-allowed rounded-full shadow-md transition-all cursor-pointer"
            >
              {isCapturing ? "Mengambil Foto..." : "Mulai Foto"}
            </button>
          ) : (
            <button
              onClick={handleResetPhotos}
              className="flex items-center gap-2 px-6 py-2.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 font-medium rounded-full shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw size={16} /> Foto Ulang
            </button>
          )}
        </div>

        {/* Gallery Preview Hasil Tangkapan Foto */}
        {photos.length > 0 && (
          <div className="flex flex-col items-center space-y-4 w-full pt-4">
            <div
              className={`grid ${
                Number(frame?.maxCaptures) === 4
                  ? "grid-cols-2 max-w-sm"
                  : "grid-cols-2 md:grid-cols-3 max-w-md"
              } gap-3 w-full items-center bg-slate-800/5 backdrop-blur-sm rounded-2xl p-3`}
            >
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-6/4 w-full bg-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <Image
                    src={photo}
                    alt={`Foto ke-${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Tombol Lanjut ke Edit Photo */}
            {photos.length === Number(frame?.maxCaptures) && (
              <button
                onClick={() => setIsModalOpen(true)}
                // href={"/edit-photo"}
                className="flex items-center justify-center gap-2 px-14 py-3 bg-border hover:bg-border/50 text-white font-semibold rounded-full shadow-md transition-all"
              >
                Lanjutkan Edit Foto
              </button>
            )}
          </div>
        )}
      </div>
      <NameInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitName={handleSaveName}
        initialName={userName}
      />
    </div>
  );
}

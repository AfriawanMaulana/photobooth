"use client";
import Image from "next/image";
import slugify from "slugify";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Download,
  Undo2,
  Redo2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
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

type CustomFilter = {
  brightness: number; // % , 100 = normal
  contrast: number; // % , 100 = normal
  saturate: number; // % , 100 = normal
  grayscale: number; // % , 0 = tidak ada
  sepia: number; // % , 0 = tidak ada
  hueRotate: number; // deg, 0 = tidak ada
  blur: number; // px, 0 = tidak ada
  invert: number; // % , 0 = tidak ada
};

const DEFAULT_FILTER: CustomFilter = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  blur: 0,
  invert: 0,
};

// const FILTER_PRESETS: Record<string, CustomFilter> = {
//   none: { ...DEFAULT_FILTER },
//   mono: { ...DEFAULT_FILTER, grayscale: 100 },
//   sepia: { ...DEFAULT_FILTER, sepia: 80 },
//   vintage: {
//     ...DEFAULT_FILTER,
//     sepia: 40,
//     contrast: 120,
//     brightness: 90,
//     saturate: 120,
//   },
//   cool: { ...DEFAULT_FILTER, hueRotate: 180, saturate: 150 },
//   warm: { ...DEFAULT_FILTER, hueRotate: -20, saturate: 130, brightness: 105 },
//   highContrast: { ...DEFAULT_FILTER, contrast: 150, brightness: 105 },
//   fade: { ...DEFAULT_FILTER, contrast: 80, brightness: 110, saturate: 70 },
//   invert: { ...DEFAULT_FILTER, invert: 100 },
//   soft: { ...DEFAULT_FILTER, blur: 1.5, brightness: 105, saturate: 110 },
//   dramatic: {
//     ...DEFAULT_FILTER,
//     contrast: 140,
//     saturate: 130,
//     brightness: 95,
//   },
// };

const buildFilterString = (f: CustomFilter): string => {
  const parts: string[] = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  if (f.grayscale !== 0) parts.push(`grayscale(${f.grayscale}%)`);
  if (f.sepia !== 0) parts.push(`sepia(${f.sepia}%)`);
  if (f.hueRotate !== 0) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.blur !== 0) parts.push(`blur(${f.blur}px)`);
  if (f.invert !== 0) parts.push(`invert(${f.invert}%)`);
  return parts.length ? parts.join(" ") : "none";
};

type FilterKey = keyof CustomFilter;

const SLIDER_CONFIG: Array<{
  key: FilterKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
}> = [
  {
    key: "brightness",
    label: "Brightness",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
    defaultValue: 100,
  },
  {
    key: "contrast",
    label: "Contrast",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
    defaultValue: 100,
  },
  {
    key: "saturate",
    label: "Saturate",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
    defaultValue: 100,
  },
  {
    key: "grayscale",
    label: "Grayscale",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    defaultValue: 0,
  },
  {
    key: "sepia",
    label: "Sepia",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    defaultValue: 0,
  },
  {
    key: "hueRotate",
    label: "Hue Rotate",
    min: -180,
    max: 180,
    step: 1,
    unit: "°",
    defaultValue: 0,
  },
  {
    key: "blur",
    label: "Blur",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "px",
    defaultValue: 0,
  },
  {
    key: "invert",
    label: "Invert",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    defaultValue: 0,
  },
];

const EXAMPLE_VALUE: Record<keyof CustomFilter, number> = {
  brightness: 130,
  contrast: 130,
  saturate: 160,
  grayscale: 100,
  sepia: 80,
  hueRotate: 90,
  blur: 2,
  invert: 100,
};

const OUTPUT_SCALE = 4;

export default function Page() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customFilter, setCustomFilter] =
    useState<CustomFilter>(DEFAULT_FILTER);

  // State untuk memilih efek mana yang sedang aktif diedit
  const [selectedEffectKey, setSelectedEffectKey] = useState<FilterKey | null>(
    null
  );
  // Cek apakah semua filter lagi di nilai default (buat nentuin tombol "None" aktif atau enggak)
  const isAllDefault = SLIDER_CONFIG.every(
    ({ key, defaultValue }) => customFilter[key] === defaultValue
  );

  // Pengganti tombol Reset - reset semua slider + tutup panel slider yang lagi kebuka
  const handleSelectNone = () => {
    setCustomFilter(DEFAULT_FILTER);
    setSelectedEffectKey(null);
  };

  const canvasRef = useRef<HTMLDivElement>(null);

  const activeFilterString = useMemo(
    () => buildFilterString(customFilter),
    [customFilter]
  );

  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>([]);
  const [scales, setScales] = useState<number[]>([]);
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  const dragState = useRef<{
    index: number | null;
    mode: "drag" | "pinch" | null;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    startDistance: number;
    startScale: number;
  } | null>(null);

  const offsetsRef = useRef<{ x: number; y: number }[]>([]);
  const scalesRef = useRef<number[]>([]);
  useEffect(() => {
    offsetsRef.current = offsets;
  }, [offsets]);
  useEffect(() => {
    scalesRef.current = scales;
  }, [scales]);

  type HistorySnapshot = {
    offsets: { x: number; y: number }[];
    scales: number[];
  };
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const isApplyingHistory = useRef(false);
  const wheelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  const pushHistory = () => {
    if (isApplyingHistory.current) return;
    const snapshot: HistorySnapshot = {
      offsets: offsetsRef.current.map((o) => ({ ...o })),
      scales: [...scalesRef.current],
    };
    const currentList = historyRef.current;
    const currentIndex = historyIndexRef.current;
    const truncated = currentList.slice(0, currentIndex + 1);
    const nextList = [...truncated, snapshot];

    historyRef.current = nextList;
    historyIndexRef.current = nextList.length - 1;
    setHistory(nextList);
    setHistoryIndex(nextList.length - 1);
  };

  const applySnapshot = (snapshot: HistorySnapshot) => {
    isApplyingHistory.current = true;
    setOffsets(snapshot.offsets.map((o) => ({ ...o })));
    setScales([...snapshot.scales]);
    requestAnimationFrame(() => {
      isApplyingHistory.current = false;
    });
  };

  const undo = () => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    applySnapshot(historyRef.current[newIndex]);
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    const currentIndex = historyIndexRef.current;
    const list = historyRef.current;
    if (currentIndex >= list.length - 1) return;
    const newIndex = currentIndex + 1;
    applySnapshot(list[newIndex]);
    historyIndexRef.current = newIndex;
    setHistoryIndex(newIndex);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;

      if (e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  useEffect(() => {
    if (photos.length) {
      let initialOffsets: { x: number; y: number }[] | null = null;
      let initialScales: number[] | null = null;

      setOffsets((prev) => {
        if (prev.length === photos.length) return prev;
        initialOffsets = photos.map(() => ({ x: 0, y: 0 }));
        return initialOffsets;
      });
      setScales((prev) => {
        if (prev.length === photos.length) return prev;
        initialScales = photos.map(() => 1);
        return initialScales;
      });

      if (historyRef.current.length === 0) {
        const baseline: HistorySnapshot = {
          offsets: initialOffsets ?? offsetsRef.current,
          scales: initialScales ?? scalesRef.current,
        };
        historyRef.current = [baseline];
        historyIndexRef.current = 0;
        setHistory([baseline]);
        setHistoryIndex(0);
      }
    }
  }, [photos]);

  const getDistance = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    index: number
  ) => {
    e.preventDefault();

    if ("touches" in e && e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      dragState.current = {
        index,
        mode: "pinch",
        startX: 0,
        startY: 0,
        startOffsetX: offsets[index]?.x || 0,
        startOffsetY: offsets[index]?.y || 0,
        startDistance: distance,
        startScale: scales[index] || 1,
      };
      window.addEventListener("touchmove", handleDragMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
      return;
    }

    const point = "touches" in e ? e.touches[0] : e;
    dragState.current = {
      index,
      mode: "drag",
      startX: point.clientX,
      startY: point.clientY,
      startOffsetX: offsets[index]?.x || 0,
      startOffsetY: offsets[index]?.y || 0,
      startDistance: 0,
      startScale: scales[index] || 1,
    };
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!dragState.current || dragState.current.index === null) return;
    e.preventDefault();
    const { index, mode } = dragState.current;

    if (mode === "pinch" && "touches" in e && e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const { startDistance, startScale } = dragState.current;
      const ratio = distance / startDistance;
      const nextScale = clamp(startScale * ratio, MIN_SCALE, MAX_SCALE);

      setScales((prev) => {
        const next = [...prev];
        next[index] = nextScale;
        return next;
      });
      return;
    }

    const point = "touches" in e ? e.touches[0] : e;
    const dx = point.clientX - dragState.current.startX;
    const dy = point.clientY - dragState.current.startY;
    const { startOffsetX, startOffsetY } = dragState.current;

    setOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: startOffsetX + dx, y: startOffsetY + dy };
      return next;
    });
  };

  const handleDragEnd = () => {
    const hadActiveDrag = dragState.current !== null;
    dragState.current = null;
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
    window.removeEventListener("touchmove", handleDragMove);
    window.removeEventListener("touchend", handleDragEnd);

    if (hadActiveDrag) pushHistory();
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const handleWheelZoom = (e: React.WheelEvent, index: number) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScales((prev) => {
      const next = [...prev];
      const current = next[index] || 1;
      next[index] = clamp(current + delta, MIN_SCALE, MAX_SCALE);
      return next;
    });

    if (wheelDebounceRef.current) clearTimeout(wheelDebounceRef.current);
    wheelDebounceRef.current = setTimeout(() => {
      pushHistory();
      wheelDebounceRef.current = null;
    }, 400);
  };

  const resetTransform = (index: number) => {
    setOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
    setScales((prev) => {
      const next = [...prev];
      next[index] = 1;
      return next;
    });
    setTimeout(() => pushHistory(), 0);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
      img.src = src;
    });
  };

  const buildComposedCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!frame) return null;

    const canvas = document.createElement("canvas");
    canvas.width = frame.canvasWidth;
    canvas.height = frame.canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await Promise.all(
      frame.position.map(async (pos, i) => {
        if (!photos[i]) return;

        let img: HTMLImageElement;
        try {
          img = await loadImage(photos[i]);
        } catch (err) {
          console.error(err);
          return;
        }

        const boxX = pos.left * OUTPUT_SCALE;
        const boxY = pos.top * OUTPUT_SCALE;
        const boxW = pos.width * OUTPUT_SCALE;
        const boxH = pos.height * OUTPUT_SCALE;

        const offset = offsets[i] || { x: 0, y: 0 };
        const userScale = scales[i] || 1;

        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        const coverScale = Math.max(boxW / naturalW, boxH / naturalH);

        const drawW = naturalW * coverScale * userScale;
        const drawH = naturalH * coverScale * userScale;

        const centerX = boxX + boxW / 2;
        const centerY = boxY + boxH / 2;

        const drawX = centerX - drawW / 2 + offset.x * OUTPUT_SCALE;
        const drawY = centerY - drawH / 2 + offset.y * OUTPUT_SCALE;

        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();

        ctx.filter = activeFilterString;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      })
    );

    if (frame.frameUrl) {
      try {
        const frameImg = await loadImage(frame.frameUrl);
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error("Gagal memuat gambar frame:", err);
      }
    }

    return canvas;
  };

  const handleDownload = async () => {
    if (!frame) return;

    setIsDownloading(true);

    const userName = localStorage.getItem("framebox-username");
    try {
      const canvas = await buildComposedCanvas();
      if (!canvas) return;

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `framebox-${
            userName ? slugify(userName, { lower: true }) : Date.now()
          }-${slugify(frame.name, {
            lower: true,
          })}.png`;
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

  const downloadAllPhotos = async () => {
    if (!photos.length) return;

    const userName = localStorage.getItem("framebox-username");
    const zip = new JSZip();

    await Promise.all(
      photos.map(async (photos, i) => {
        const res = await fetch(photos);
        const blob = await res.blob();
        zip.file(`framebox-${i + 1}.png`, blob);
      })
    );

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(
      content,
      `framebox${
        userName && "-" + slugify(userName, { lower: true })
      }-photos.zip`
    );
  };

  const canvasW = (frame && frame?.canvasWidth / 4) || 270;
  const canvasH = (frame && frame?.canvasHeight / 4) || 480;

  // Mendapatkan config slider yang sedang aktif dipilih
  const currentEffectConfig = useMemo(() => {
    return (
      SLIDER_CONFIG.find((c) => c.key === selectedEffectKey) || SLIDER_CONFIG[0]
    );
  }, [selectedEffectKey]);

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-border/20 p-10 md:p-20 gap-6">
      <h1 className="font-bold text-2xl">Preview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10 w-full h-auto justify-center p-4 bg-white rounded-3xl">
        <div className="flex flex-col gap-2 items-center justify-center">
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
              const w = pos.width;
              const h = pos.height;
              const x = pos.left;
              const y = pos.top;

              const offset = offsets[i] || { x: 0, y: 0 };
              const scale = scales[i] || 1;

              return (
                photos[i] && (
                  <div
                    key={i}
                    className="absolute overflow-hidden z-0 cursor-move touch-none select-none"
                    style={{
                      width: w,
                      height: h,
                      top: y,
                      left: x,
                    }}
                    onMouseDown={(e) => handleDragStart(e, i)}
                    onTouchStart={(e) => handleDragStart(e, i)}
                    onDoubleClick={() => resetTransform(i)}
                    onWheel={(e) => handleWheelZoom(e, i)}
                    title="Geser untuk posisi, scroll/pinch untuk zoom, klik dua kali untuk reset"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photos[i]}
                      alt=""
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: "center",
                        filter: activeFilterString,
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                )
              );
            })}
          </div>
          {/* UNDO / REDO */}
          <div className="flex items-center gap-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="flex items-center gap-2 py-2 px-5 rounded-full shadow shadow-black/10 bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
            >
              <Undo2 size={18} />
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="flex items-center gap-2 py-2 px-5 rounded-full shadow shadow-black/10 bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
            >
              <Redo2 size={18} />
              Redo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* <h2 className="font-bold text-lg">Filters</h2> */}

          {/* Pilihan Efek Per-Item */}
          <div className="flex flex-col gap-4 bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-sm">
                <SlidersHorizontal size={16} />
                <span>Custom Adjust</span>
              </div>
              {/* <button
                onClick={() => setCustomFilter(DEFAULT_FILTER)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors"
                title="Reset semua filter ke default"
              >
                <RotateCcw size={14} />
                Reset Filter
              </button> */}
            </div>

            {/* Pilihan Efek (Pill Buttons) */}
            <div
              className="flex gap-1.5 overflow-x-auto flex-nowrap snap-x snap-mandatory scroll-smooth pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:snap-none md:mx-0 md:px-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                onClick={handleSelectNone}
                className={`relative text-xs rounded-md border overflow-hidden transition-all cursor-pointer shrink-0 snap-start ${
                  isAllDefault && !selectedEffectKey
                    ? "border-black shadow-md shadow-black/40"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Image
                  src={photos[0] || "/assets/mountain.jpg"}
                  alt=""
                  width={70}
                  height={70}
                  className="rounded-md"
                />
                <p>None</p>
              </button>

              {SLIDER_CONFIG.map(({ key, label, defaultValue }) => {
                const isActive = selectedEffectKey === key;
                const isModified = customFilter[key] !== defaultValue;

                const previewFilter = buildFilterString({
                  ...DEFAULT_FILTER,
                  [key]: EXAMPLE_VALUE[key],
                });

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEffectKey(key)}
                    className={`relative text-xs rounded-md border overflow-hidden transition-all cursor-pointer shrink-0 snap-start ${
                      isActive
                        ? "border-black shadow-md shadow-black/40"
                        : isModified
                        ? "bg-slate-200 border-slate-300 text-slate-900 font-medium"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Image
                      src={photos[0] || "/assets/mountain.jpg"}
                      alt=""
                      width={70}
                      height={70}
                      style={{ filter: previewFilter }}
                      className="rounded-md"
                    />
                    <p>
                      {label} {isModified ? "•" : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Slider Efek Terpilih */}
            {selectedEffectKey && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                  <label htmlFor={`filter-${currentEffectConfig.key}`}>
                    {currentEffectConfig.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span>
                      {customFilter[currentEffectConfig.key]}
                      {currentEffectConfig.unit}
                    </span>
                    <button
                      onClick={() =>
                        setCustomFilter((prev) => ({
                          ...prev,
                          [currentEffectConfig.key]:
                            currentEffectConfig.defaultValue,
                        }))
                      }
                      className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                    >
                      Reset Efek
                    </button>
                  </div>
                </div>

                <input
                  id={`filter-${currentEffectConfig.key}`}
                  type="range"
                  min={currentEffectConfig.min}
                  max={currentEffectConfig.max}
                  step={currentEffectConfig.step}
                  value={customFilter[currentEffectConfig.key]}
                  onChange={(e) => {
                    // 1. Ekstrak valuenya secara langsung sebelum setter async
                    const val = Number(e.target.value);
                    const key = currentEffectConfig.key;

                    // 2. Masukkan nilai yang sudah aman ke state
                    setCustomFilter((prev) => ({
                      ...prev,
                      [key]: val,
                    }));
                  }}
                  className="w-full cursor-pointer accent-black h-2 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOMBOL DOWNLOAD */}
      <div className="flex flex-wrap items-center gap-4 justify-center">
        <button
          onClick={downloadAllPhotos}
          disabled={isDownloading || photos.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-black/80 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Download size={20} />
          {isDownloading ? "Mengunduh..." : "Download Semua Foto"}
        </button>

        <button
          onClick={handleDownload}
          disabled={isDownloading || photos.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-border hover:bg-border/80 disabled:bg-border/20 text-white font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Download size={20} />
          {isDownloading ? "Mengunduh..." : "Download Foto Strip"}
        </button>
      </div>
    </div>
  );
}

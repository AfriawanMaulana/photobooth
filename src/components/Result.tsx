import { useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";

const frameList = [
  "/frame/pig.png",
  "/frame/flower.png",
  "/frame/cat.png",
  "/frame/love.png",
  "/frame/laut.png",
  "/frame/pencil.png",
  "/frame/sweet.png",
];

export default function Result() {
  const { state } = useLocation() as { state: { photos?: string[] } };
  const photos = state?.photos ?? [];

  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);

  const downloadResult = async () => {
    if (!frameRef.current) return;
    const canvas = await html2canvas(frameRef.current, {
      useCORS: true,
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = "result.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col space-y-2 w-full h-screen justify-center items-center">
      <div
        id="frame"
        ref={frameRef}
        className="relative h-96 w-96 bg-white border-2 border-white rounded-md"
      >
        <img src={`${frameSrc}`} className="z-1 w-96 h-96 absolute inset-0" />
        <div className="grid grid-cols-2 gap-1 w-full h-full">
          {photos.map((item, index) => (
            <div
              key={index}
              className="w-full h-full bg-white rounded-lg bg-no-repeat bg-center"
              style={{
                backgroundImage: `url(${item})`,
                backgroundSize: "cover",
              }}
            ></div>
          ))}
        </div>
      </div>
      <button
        onClick={downloadResult}
        className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-full"
      >
        Download
      </button>
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setFrameSrc(null)}
          className="border w-20 h-20 rounded-md"
        ></button>
        {frameList.map((item, index) => (
          <button key={index} onClick={() => setFrameSrc(item)}>
            <img src={item} width={100} height={100} className="w-20 h-20" />
          </button>
        ))}
      </div>
    </div>
  );
}

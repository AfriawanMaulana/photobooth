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

const gridModel = [
  {
    url: "/2_1.77a265cf.png",
    grid: 2,
  },
  {
    url: "/3_1.38147275.png",
    grid: 1,
  },
  {
    url: "/4_1.4d611fe7.png",
    grid: 1,
  },
  {
    url: "/4_5.82bbc796.png",
    grid: 2,
  },
];

export default function Result() {
  const { state } = useLocation() as { state: { photos?: string[] } };
  const photos = state?.photos ?? [];

  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [gridAmount, setGridAmount] = useState<number>(1);

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
    <div className="flex flex-col space-y-2 w-full h-screen justify-center items-center bg-gradient-to-br from-pink-200 via-white to-pink-200">
      {/* Back  */}
      <a href="/" className="absolute top-4 left-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="size-8 text-pink-500 cursor-pointer"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      </a>

      {/* Canvas */}
      <div
        id="frame"
        ref={frameRef}
        className={`${
          gridAmount == 1 && photos.length > 1 ? "h-[100%] w-40" : "h-96 w-96"
        } relative bg-white border-2 border-white rounded-md`}
      >
        <img
          src={`${frameSrc}`}
          className="z-1 w-full h-[100%] absolute inset-0"
        />
        <div
          className={`grid grid-cols-${
            photos.length == 1 ? "1" : gridAmount
          } gap-1 w-full h-full`}
        >
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

      {/* Frame list */}
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

      {/* Grid model */}
      <div className="flex gap-2 items-center">
        {gridModel.map((item, index) => (
          <button key={index} onClick={() => setGridAmount(item.grid)}>
            <img
              src={item.url}
              width={100}
              height={100}
              className="w-20 h-20"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

import Webcam from "react-webcam";
import "./App.css";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [totalPhotos, setTotalPhotos] = useState<number>(1);
  const [delay, setDelay] = useState<number>(3000);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [noAction, setNoAction] = useState(false);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const photoSrc = webcamRef.current.getScreenshot();
    if (!photoSrc) return;
    setPhotos((prev) => [...prev, photoSrc]);
  }, [webcamRef]);

  const takePicture = () => {
    setPhotos([]);
    setNoAction(true);

    for (let i = 0; i < totalPhotos; i++) {
      setTimeout(() => {
        let count = delay / 1000;
        const countdownInterval = setInterval(() => {
          setCountdown(count);
          count--;

          if (count < 0) {
            setCountdown(null);
            handleCapture();
            clearInterval(countdownInterval);
          }
        }, 1000);
      }, i * delay);
    }

    setTimeout(() => {
      setNoAction(false);
    }, totalPhotos * delay + 1000);
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  return (
    <>
      <div className="flex flex-col space-y-2 w-full h-screen items-center justify-center px-4">
        {/* Set foto & delay */}
        <div className="flex gap-4">
          <select
            name="picGrid"
            id="picGrid"
            value={totalPhotos}
            onChange={(e) => setTotalPhotos(Number(e.currentTarget.value))}
            className="w-20 text-center border rounded-md p-1"
          >
            <option value={1}>1 Foto</option>
            <option value={2}>2 Foto</option>
            <option value={3}>3 Foto</option>
            <option value={4}>4 Foto</option>
          </select>
          <select
            name="delay"
            id="delay"
            defaultValue={delay}
            onChange={(e) => setDelay(Number(e.currentTarget.value))}
            className="w-20 text-center border rounded-md p-1"
          >
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
          </select>
        </div>

        {/* Webcam */}
        <div className="flex flex-col md:flex-row gap-10">
          <div className="hidden border w-40 md:flex flex-col items-center space-y-2">
            <button>Mirror</button>
          </div>
          <div className="relative flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              width={650}
              height={800}
              mirrored
              screenshotQuality={1}
              videoConstraints={videoConstraints}
              // imageSmoothing
              className="rounded-4xl border-4 border-pink-400 h-96 md:h-[450px] object-cover"
            />
            <p className="font-bold text-8xl text-white absolute">
              {countdown}
            </p>
          </div>
          <div className="grid grid-cols-2 md:flex md:flex-col gap-2 w-full md:w-40">
            {photos.map((item, index) => (
              <img
                src={item}
                key={index}
                width={200}
                height={200}
                className="w-auto md:w-40 h-auto rounded-xl border-2 border-pink-400"
              />
            ))}
          </div>
        </div>

        {/* Main Button */}
        {!noAction && photos.length > 0 ? (
          <button
            onClick={() => navigate("/result", { state: { photos } })}
            className="p-4 w-96 text-center bg-pink-300 not-disabled:hover:bg-pink-400 rounded-full text-white text-xl font-bold cursor-pointer disabled:cursor-not-allowed"
          >
            Berikutnya
          </button>
        ) : (
          <button
            onClick={takePicture}
            disabled={noAction}
            className="p-4 w-96 bg-pink-300 not-disabled:hover:bg-pink-400 rounded-full text-white text-xl font-bold cursor-pointer disabled:cursor-not-allowed"
          >
            {!noAction ? (
              <span className="inline-flex gap-4 items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
                Mulai Foto
              </span>
            ) : (
              <span className="inline-flex gap-4 items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
                Memotret...
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}

export default App;

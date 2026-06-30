import { useEffect, useRef, useState } from "react";

export default function OcrScanner({ onScanComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Warte auf Kamera-Freigabe...");
  const [progress, setProgress] = useState(0);
  const streamRef = useRef(null);

  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus("Kamera bereit. Bereit zum Scannen!");
        }
      } catch (err) {
        console.error("Kamerafehler: ", err);
        setStatus("❌ Zugriff auf Kamera verweigert oder nicht verfügbar.");
      }
    }

    startWebcam();

    // Clean-up: Kamera ausschalten, wenn die Komponente verlassen wird
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Spiegelung korrigieren
    ctx.translate(canvas.width, 0);
    ctx.scale(1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg");
    setStatus("⏳ Foto verarbeitet... Starte Texterkennung...");
    setProgress(0);

    try {
      // Zugriff auf das globale Tesseract aus der index.html
      const result = await window.Tesseract.recognize(imageDataUrl, "deu", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const erkannterText = result.data.text || "";
      if (erkannterText.trim() === "") {
        setStatus(
          "Es wurde kein Text im Bild erkannt. Bitte näher heranhalten.",
        );
      } else {
        setStatus("✅ Erkennung abgeschlossen!");
        onScanComplete(erkannterText); // Daten weiterreichen
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Fehler bei der Erkennung.");
    }
  };

  return (
    <div className="box">
      <p>Halte ein Dokument in die Kamera und klicke auf "Foto scannen".</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "8px",
          background: "#000",
        }}
      />

      <button
        onClick={handleCapture}
        style={{
          backgroundColor: "#0066cc",
          color: "white",
          padding: "12px",
          border: "none",
          borderRadius: "4px",
          width: "100%",
          maxWidth: "400px",
          marginTop: "10px",
          cursor: "pointer",
        }}
      >
        📸 Foto scannen
      </button>

      <div style={{ fontWeight: "bold", color: "#0066cc", margin: "15px 0" }}>
        {progress > 0 && progress < 100
          ? `🔄 Erkenne Text: ${progress}%`
          : status}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

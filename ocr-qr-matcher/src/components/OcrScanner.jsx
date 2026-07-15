import { useEffect, useRef, useState } from "react";

// Größere Fotos bringen kaum mehr Genauigkeit, machen Tesseract aber deutlich langsamer
const MAX_DIMENSION = 2200;

export default function OcrScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  const [status, setStatus] = useState(
    "Bitte fotografiere das Dokument mit deiner Handykamera.",
  );
  const [progress, setProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  async function getWorker() {
    if (!workerRef.current) {
      const worker = await window.Tesseract.createWorker(
        "deu",
        window.Tesseract.OEM.LSTM_ONLY,
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        },
      );
      // Dokumente sind i.d.R. ein einzelner, gleichmäßiger Textblock
      await worker.setParameters({
        tessedit_pageseg_mode: window.Tesseract.PSM.SINGLE_BLOCK,
      });
      workerRef.current = worker;
    }
    return workerRef.current;
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // erlaubt erneute Auswahl derselben Datei
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = canvasRef.current;
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(image.width, image.height),
      );
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.filter = "grayscale(1) contrast(1.35) brightness(1.05)";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      setPreviewSrc(canvas.toDataURL("image/png"));
      setStatus("Foto aufgenommen. Bitte prüfen und Text erkennen.");
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  }

  function handleRetake() {
    setPreviewSrc(null);
    setProgress(0);
    setStatus("Bitte fotografiere das Dokument mit deiner Handykamera.");
  }

  async function handleRecognize() {
    setIsRecognizing(true);
    setProgress(0);
    setStatus("⏳ Starte Texterkennung...");

    try {
      const worker = await getWorker();
      const result = await worker.recognize(canvasRef.current);
      const erkannterText = result.data.text || "";

      if (erkannterText.trim() === "") {
        setStatus(
          "Es wurde kein Text im Bild erkannt. Bitte näher heranhalten und erneut fotografieren.",
        );
        setIsRecognizing(false);
      } else {
        setStatus("✅ Erkennung abgeschlossen!");
        onScanComplete(erkannterText);
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Fehler bei der Erkennung.");
      setIsRecognizing(false);
    }
  }

  return (
    <div className="box">
      <p>
        Fotografiere das Dokument mit der Kamera deines Smartphones. Achte auf
        gute Beleuchtung, einen scharfen Fokus und einen planen Aufnahmewinkel.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {!previewSrc ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            backgroundColor: "#0066cc",
            color: "white",
            padding: "12px",
            border: "none",
            borderRadius: "4px",
            width: "100%",
            maxWidth: "400px",
            cursor: "pointer",
          }}
        >
          📸 Foto aufnehmen
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={previewSrc}
            alt="Aufgenommenes Dokument"
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={handleRetake}
              disabled={isRecognizing}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: isRecognizing ? "default" : "pointer",
              }}
            >
              🔄 Neu aufnehmen
            </button>
            <button
              onClick={handleRecognize}
              disabled={isRecognizing}
              style={{
                backgroundColor: "#28A745",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: isRecognizing ? "default" : "pointer",
              }}
            >
              🔎 Text erkennen
            </button>
          </div>
        </div>
      )}

      <div style={{ fontWeight: "bold", color: "#0066cc", margin: "15px 0" }}>
        {progress > 0 && progress < 100
          ? `🔄 Erkenne Text: ${progress}%`
          : status}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

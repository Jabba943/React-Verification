import { useEffect, useRef, useState } from "react";
import "../styles/OcrScanner.css";

const MAX_DIMENSION = 3000;
const MIN_WORD_CONFIDENCE = 40;

function filterLowConfidenceText(data) {
  if (!data.lines || data.lines.length === 0) {
    return data.text;
  }

  return data.lines
    .map((line) =>
      line.words
        .filter((word) => word.confidence >= MIN_WORD_CONFIDENCE)
        .map((word) => word.text)
        .join(" "),
    )
    .filter((line) => line.trim() !== "")
    .join("\n");
}

export default function OcrScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  const [status, setStatus] = useState(
    "Bitte fotografiere die Dokumentseite (z. B. ein Zeugnis) mit deiner Handykamera.",
  );
  const [progress, setProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
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
    setRecognizedText(null);
    setProgress(0);
    setStatus(
      "Bitte fotografiere die Dokumentseite (z. B. ein Zeugnis) mit deiner Handykamera.",
    );
  }

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

      await worker.setParameters({
        tessedit_pageseg_mode: window.Tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
      });
      workerRef.current = worker;
    }
    return workerRef.current;
  }

  async function handleRecognize() {
    setIsRecognizing(true);
    setProgress(0);
    setStatus("⏳ Starte Texterkennung...");

    try {
      const worker = await getWorker();
      const result = await worker.recognize(canvasRef.current);
      const erkannterText = filterLowConfidenceText(result.data).trim();

      if (erkannterText.trim() === "") {
        setStatus(
          "Es wurde kein Text im Bild erkannt. Bitte näher heranhalten und erneut fotografieren.",
        );
        setIsRecognizing(false);
      } else {
        setStatus(
          "Bitte den erkannten Text prüfen und bei Bedarf korrigieren.",
        );
        setRecognizedText(erkannterText);
        setIsRecognizing(false);
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Fehler bei der Erkennung.");
      setIsRecognizing(false);
    }
  }

  function handleConfirmText() {
    onScanComplete(recognizedText);
  }

  return (
    <div className="app-box">
      {recognizedText === null && (
        <p>
          Fotografiere die gesamte Dokumentseite. Achte darauf, dass die ganze
          Seite im Bild ist, und auf gute Beleuchtung, einen scharfen Fokus und
          einen planen Aufnahmewinkel.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {recognizedText !== null ? (
        <div className="ocr-review">
          <p className="ocr-review-hint">
            Bitte den erkannten Text prüfen und Fehler korrigieren, bevor er
            weiterverwendet wird:
          </p>
          <textarea
            value={recognizedText}
            onChange={(e) => setRecognizedText(e.target.value)}
            rows={10}
            className="ocr-textarea"
          />

          <div className="actions-row actions-row--center">
            <button
              onClick={handleRetake}
              className="ocr-btn ocr-btn--secondary"
            >
              🔄 Neu fotografieren
            </button>
            <button
              onClick={handleConfirmText}
              disabled={recognizedText.trim() === ""}
              className="ocr-btn ocr-btn--success"
            >
              ✅ Text bestätigen
            </button>
          </div>
        </div>
      ) : !previewSrc ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ocr-capture-btn"
        >
          📸 Foto aufnehmen
        </button>
      ) : (
        <div className="ocr-preview-column">
          <img
            src={previewSrc}
            alt="Aufgenommenes Dokument"
            className="ocr-preview-image"
          />

          <div className="actions-row">
            <button
              onClick={handleRetake}
              disabled={isRecognizing}
              className="ocr-btn ocr-btn--secondary"
            >
              🔄 Neu aufnehmen
            </button>
            <button
              onClick={handleRecognize}
              disabled={isRecognizing}
              className="ocr-btn ocr-btn--success"
            >
              🔎 Text erkennen
            </button>
          </div>
        </div>
      )}

      {recognizedText === null && (
        <div className="ocr-status">
          {progress > 0 && progress < 100
            ? `🔄 Erkenne Text: ${progress}%`
            : status}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

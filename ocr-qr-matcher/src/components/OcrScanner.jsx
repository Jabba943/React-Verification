import { useEffect, useRef, useState } from "react";

// Größere Fotos bringen kaum mehr Genauigkeit, machen Tesseract aber deutlich langsamer
const MAX_DIMENSION = 2200;

// Wörter unterhalb dieser Konfidenz (0-100) sind meist Kauderwelsch aus dem
// Bildhintergrund und werden aus dem Ergebnis entfernt.
const MIN_WORD_CONFIDENCE = 40;

// Baut den Text zeilenweise aus den Wörtern wieder zusammen und lässt dabei
// Wörter mit niedriger Erkennungs-Konfidenz weg.
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
    "Bitte fotografiere das Dokument mit deiner Handykamera.",
  );
  const [progress, setProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState(null);

  // Worker wird einmalig erzeugt (inkl. Sprachdaten-Download) und über
  // mehrere Aufnahmen hinweg wiederverwendet.
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
      // Graustufen + Kontrastanhebung verbessern die Trefferquote von
      // Tesseract bei Handyfotos mit ungleichmäßiger Beleuchtung spürbar.
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
    setStatus("Bitte fotografiere das Dokument mit deiner Handykamera.");
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
        setStatus("Bitte den erkannten Text prüfen und bei Bedarf korrigieren.");
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
    <div className="box">
      {recognizedText === null && (
        <p>
          Fotografiere das Dokument mit der Kamera deines Smartphones. Achte
          auf gute Beleuchtung, einen scharfen Fokus und einen planen
          Aufnahmewinkel.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {recognizedText !== null ? (
        <div style={{ textAlign: "left" }}>
          <p style={{ textAlign: "center" }}>
            Bitte den erkannten Text prüfen und Fehler korrigieren, bevor er
            weiterverwendet wird:
          </p>
          <textarea
            value={recognizedText}
            onChange={(e) => setRecognizedText(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid #ccd6e0",
              resize: "vertical",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={handleRetake}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔄 Neu fotografieren
            </button>
            <button
              onClick={handleConfirmText}
              disabled={recognizedText.trim() === ""}
              style={{
                backgroundColor: "#28A745",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: recognizedText.trim() === "" ? "default" : "pointer",
                opacity: recognizedText.trim() === "" ? 0.6 : 1,
              }}
            >
              ✅ Text bestätigen
            </button>
          </div>
        </div>
      ) : !previewSrc ? (
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

      {recognizedText === null && (
        <div style={{ fontWeight: "bold", color: "#0066cc", margin: "15px 0" }}>
          {progress > 0 && progress < 100
            ? `🔄 Erkenne Text: ${progress}%`
            : status}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

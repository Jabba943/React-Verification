import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import OcrScanner from "./components/OcrScanner";
import QrScanner from "./components/QrScanner";
import createHmacSHA512 from "../scripts/crypto.js";

// CSS-Styles direkt im File für die Einfachheit deiner CSS-Vorgaben
const styles = {
  container: {
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: "600px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#f5f7fa",
    color: "#333",
  },
  box: {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    marginBottom: "20px",
    textAlign: "center",
  },
  output: {
    width: "100%",
    minHeight: "100px",
    padding: "10px",
    background: "#eef2f7",
    borderRadius: "4px",
    border: "1px solid #ccd6e0",
    textAlign: "left",
    boxSizing: "border-box",
  },
};

// eslint-disable-next-line react-refresh/only-export-components
function MainApp() {
  const [step, setStep] = useState(1);
  const [ocrText, setOcrText] = useState("");
  const [qrContent, setQrContent] = useState("");

  const handleOcrFinished = (text) => {
    setOcrText(text);
    setStep(2); // Wechsel zu QR-Scanner
  };

  const handleQrFinished = (code) => {
    setQrContent(code);
    setStep(3); // Wechsel zum Abgleich
  };

  const handleReset = () => {
    setOcrText("");
    setQrContent("");
    setStep(1);
  };

  // Textabgleich-Funktion
  const checkMatch = () => {
    const textNormalisiert = ocrText.replace(/\s+/g, "");
    const qrNormalisiert = qrContent.replace(/\s+/g, "");

    return createHmacSHA512(textNormalisiert, "test").includes(qrNormalisiert);
  };

  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: "center" }}>Dokumenten-Prüfer</h1>

      {step === 1 && (
        <div style={styles.box}>
          <h2>📷 Schritt 1: Dokument scannen</h2>
          <OcrScanner onScanComplete={handleOcrFinished} />
        </div>
      )}

      {step === 2 && (
        <div style={styles.box}>
          <h2>🔍 Schritt 2: QR-Code scannen</h2>
          <QrScanner onScanComplete={handleQrFinished} />
        </div>
      )}

      {/* SCHRITT 3: TEXTAUSGABE & VERGLEICH */}
      {step === 3 && (
        <div>
          <div style={styles.box}>
            <h2>📊 Schritt 3: Ergebnis des Abgleichs</h2>

            {checkMatch() ? (
              <div style={styles.success}>✓ ORIGINAL DOKUMENT</div>
            ) : (
              <div style={styles.error}>❌ DOKUMENT WURDE ANGEPASST</div>
            )}

            <p>
              Der QR-Inhalt wurde im Dokument{" "}
              {checkMatch() ? "gefunden" : "nicht gefunden"}.
            </p>
          </div>

          <div style={styles.box}>
            <h3>Gescannter Text aus Dokument:</h3>
            <div style={styles.output}>{ocrText}</div>

            <h3>QR-Code Inhalt:</h3>
            <div
              style={{
                ...styles.output,
                minHeight: "auto",
                fontWeight: "bold",
              }}
            >
              {qrContent}
            </div>

            <button onClick={handleReset} style={styles.button}>
              🔄 Neuen Scan starten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// React ins DOM einhängen
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
);

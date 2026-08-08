import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import OcrScanner from "./components/OcrScanner";
import QrScanner from "./components/QrScanner";
import CreateQR from "./components/CreateQR";
import { createHmacSHA512 } from "./scripts/crypto.js";
import "./styles/index.css";

export function MainApp() {
  // Modus-State für das Hauptmenü ("select", "verifizieren", "ausstellen")
  const [mode, setMode] = useState("select");

  // Scan-Vorgangs-States
  const [step, setStep] = useState(1);
  const [ocrText, setOcrText] = useState("");
  const [qrContent, setQrContent] = useState("");

  const handleOcrFinished = (text) => {
    setOcrText(text);
    setStep(2);
  };

  const handleQrFinished = (code) => {
    setQrContent(code);
    setStep(3);
  };

  // Hashfunktion inkl. Textbereinigung
  const getOcrHash = () => {
    const textNormalisiert = ocrText.replace(/\s+/g, "");
    return createHmacSHA512(textNormalisiert);
  };

  // Textabgleich-Funktion nutzt die Hash-Funktion
  const checkMatch = () => {
    const qrNormalisiert = qrContent.replace(/\s+/g, "");
    return qrNormalisiert !== "" && getOcrHash() === qrNormalisiert;
  };

  // Setzt den Scan-Vorgang zurück
  const handleReset = () => {
    setOcrText("");
    setQrContent("");
    setStep(1);
  };

  // Setzt alles zurück und geht ins Hauptmenü
  const handleBackToMenu = () => {
    handleReset();
    setMode("select");
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Dokumenten-System</h1>

      {/* --- STARTMENÜ --- */}
      {mode === "select" && (
        <div className="app-box">
          <h2>Bitte wählen Sie eine Option:</h2>
          <div>
            <button
              className="btn btn-primary"
              onClick={() => setMode("verifizieren")}
            >
              Verifizieren
            </button>
            <button
              className="btn btn-success"
              onClick={() => setMode("ausstellen")}
            >
              Ausstellen
            </button>
          </div>
        </div>
      )}

      {/* --- MODUS: AUSSTELLEN --- */}
      {mode === "ausstellen" && (
        <div>
          <button
            className="btn btn-secondary btn-back"
            onClick={handleBackToMenu}
          >
            🔙 Zurück zum Menü
          </button>
          <h1 className="app-title">📄 Dokument ausstellen</h1>

          {step === 1 && (
            <div className="app-box">
              <h2>📷 Schritt 1: Dokument scannen</h2>
              <OcrScanner onScanComplete={handleOcrFinished} />
            </div>
          )}

          {step === 2 && (
            <div className="app-box">
              <h2>✨ Schritt 2: Gesicherten QR-Code generieren</h2>
              <CreateQR text={ocrText} onReset={handleReset} />
            </div>
          )}
        </div>
      )}

      {/* --- MODUS: VERIFIZIEREN --- */}
      {mode === "verifizieren" && (
        <div>
          <button
            className="btn btn-secondary btn-back"
            onClick={handleBackToMenu}
          >
            🔙 Zurück zum Menü
          </button>
          <h1 className="app-title">📄 Dokument verifizieren</h1>

          {step === 1 && (
            <div className="app-box">
              <h2>📷 Schritt 1: Dokument scannen</h2>
              <OcrScanner onScanComplete={handleOcrFinished} />
            </div>
          )}

          {step === 2 && (
            <div className="app-box">
              <h2>🔍 Schritt 2: QR-Code scannen</h2>
              <QrScanner onScanComplete={handleQrFinished} />
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="app-box">
                <h2>📊 Schritt 3: Ergebnis des Abgleichs</h2>

                {checkMatch() ? (
                  <div className="status-success">✓ ORIGINAL DOKUMENT</div>
                ) : (
                  <div className="status-error">
                    ❌ DOKUMENT WURDE ANGEPASST
                  </div>
                )}

                <p>
                  Der QR-Inhalt wurde im Dokument{" "}
                  {checkMatch() ? "gefunden" : "nicht gefunden"}.
                </p>
              </div>

              <div className="app-box">
                <h3>Gescannter Text aus Dokument:</h3>
                <div className="app-output">{ocrText}</div>

                <button onClick={handleReset} className="btn btn-primary">
                  🔄 Neuen Scan starten
                </button>
              </div>
            </div>
          )}
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

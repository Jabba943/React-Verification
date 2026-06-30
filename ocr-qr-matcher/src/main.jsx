import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import OcrScanner from "./components/OcrScanner";
import QrScanner from "./components/QrScanner";
import CreateQR from "./components/CreateQR"; // NEU: Import der QR-Generierungs-Komponente
import { createHmacSHA512 } from "./scripts/crypto.js";

// Einheitliche CSS-Styles direkt im File
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
  // Basis-Button Style
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    margin: "10px 5px",
    borderRadius: "4px",
    border: "none",
    color: "white",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  // Button-Farbvarianten
  btnPrimary: { backgroundColor: "#007BFF" },
  btnSuccess: { backgroundColor: "#28A745" },
  btnSecondary: { backgroundColor: "#6c757d", marginBottom: "20px" },

  success: {
    color: "green",
    fontWeight: "bold",
    margin: "10px 0",
  },
  error: {
    color: "red",
    fontWeight: "bold",
    margin: "10px 0",
  },
};

// eslint-disable-next-line react-refresh/only-export-components
function MainApp() {
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

  //Hashfunktion incl. Textbereinigung
  const getOcrHash = () => {
    const textNormalisiert = ocrText.replace(/\s+/g, "");
    return createHmacSHA512(textNormalisiert);
  };

  // Textabgleich-Funktion nutzt jetzt die neue Hash-Funktion
  const checkMatch = () => {
    const qrNormalisiert = qrContent.replace(/\s+/g, "");
    return getOcrHash().includes(qrNormalisiert);
  };

  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: "center" }}>Dokumenten-System</h1>

      {/* --- STARTMENÜ --- */}
      {mode === "select" && (
        <div style={styles.box}>
          <h2>Bitte wählen Sie eine Option:</h2>
          <div>
            <button
              style={{ ...styles.button, ...styles.btnPrimary }}
              onClick={() => setMode("verifizieren")}
            >
              Verifizieren
            </button>
            <button
              style={{ ...styles.button, ...styles.btnSuccess }}
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
            style={{ ...styles.button, ...styles.btnSecondary }}
            onClick={handleBackToMenu}
          >
            🔙 Zurück zum Menü
          </button>
          <h1 style={{ textAlign: "center" }}>📄 Dokument ausstellen</h1>

          {step === 1 && (
            <div style={styles.box}>
              <h2>📷 Schritt 1: Dokument scannen</h2>
              <OcrScanner onScanComplete={handleOcrFinished} />
            </div>
          )}

          {step === 2 && (
            <div style={styles.box}>
              <h2>✨ Schritt 2: Gesicherten QR-Code generieren</h2>
              <CreateQR
                text={ocrText}
                buttonStyle={styles.button}
                primaryButtonStyle={styles.btnPrimary}
                successButtonStyle={styles.btnSuccess}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      )}

      {/* --- MODUS: VERIFIZIEREN --- */}
      {mode === "verifizieren" && (
        <div>
          <button
            style={{ ...styles.button, ...styles.btnSecondary }}
            onClick={handleBackToMenu}
          >
            🔙 Zurück zum Menü
          </button>
          <h1 style={{ textAlign: "center" }}>📄 Dokument verifizieren</h1>

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

                <button
                  onClick={handleReset}
                  style={{ ...styles.button, ...styles.btnPrimary }}
                >
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

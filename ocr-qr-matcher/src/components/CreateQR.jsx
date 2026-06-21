import { useState } from "react";
import QRCode from "qrcode";
import { createHmacSHA512 } from "../scripts/crypto.js"; // Importiert deine Krypto-Funktion

const styles = {
  previewText: {
    width: "100%",
    maxHeight: "80px",
    overflowY: "auto",
    padding: "10px",
    background: "#eef2f7",
    borderRadius: "4px",
    border: "1px solid #ccd6e0",
    textAlign: "left",
    boxSizing: "border-box",
    fontSize: "14px",
    marginBottom: "15px",
  },
  qrBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#f0f4f8",
    borderRadius: "6px",
    display: "inline-block",
    border: "1px dashed #007BFF",
  },
  qrImage: {
    width: "200px",
    height: "200px",
    display: "block",
    margin: "0 auto 10px auto",
  },
};

function CreateQR({
  text,
  buttonStyle,
  primaryButtonStyle,
  successButtonStyle,
  onReset,
}) {
  const [qrSrc, setQrSrc] = useState("");
  const [generatedHash, setGeneratedHash] = useState("");

  const handleGenerate = async () => {
    if (!text) return;

    try {
      // 1. Text exakt so normalisieren wie beim Verifizieren
      const textNormalisiert = text.replace(/\s+/g, "");

      // 2. Den HMAC-Hash erzeugen
      const hash = createHmacSHA512(textNormalisiert);
      setGeneratedHash(hash);

      // 3. Den QR-Code aus dem HASH generieren (hohe Auflösung für den Druck)
      const response = await QRCode.toDataURL(hash, {
        width: 600,
        margin: 2,
        color: {
          dark: "#333333",
          light: "#FFFFFF",
        },
      });
      setQrSrc(response);
    } catch (error) {
      console.error("Fehler bei der QR-Generierung:", error);
    }
  };

  const downloadQrCode = () => {
    if (!qrSrc) return;

    const downloadLink = document.createElement("a");
    downloadLink.href = qrSrc;
    downloadLink.download = `document_qr_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div>
      <h3>Gescannter Text für die Signierung:</h3>
      <div style={styles.previewText}>{text || "Kein Text vorhanden."}</div>

      {!qrSrc ? (
        <button
          onClick={handleGenerate}
          style={{ ...buttonStyle, ...primaryButtonStyle }}
        >
          🔒 Verschlüsselten QR-Code generieren
        </button>
      ) : (
        <div>
          <div style={styles.qrBox}>
            <img src={qrSrc} alt="Generierter QR Code" style={styles.qrImage} />
            <p
              style={{
                fontSize: "11px",
                color: "#666",
                wordBreak: "break-all",
                maxWidth: "250px",
              }}
            >
              <strong>Generierter Hash:</strong>
              <br />
              {generatedHash}
            </p>

            <button
              onClick={downloadQrCode}
              style={{ ...buttonStyle, ...successButtonStyle }}
            >
              💾 Als PNG downloaden
            </button>
          </div>

          <div style={{ marginTop: "15px" }}>
            <button
              onClick={onReset}
              style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
            >
              🔄 Neues Dokument ausstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateQR;

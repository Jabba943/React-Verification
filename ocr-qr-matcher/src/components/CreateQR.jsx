import { useState } from "react";
import QRCode from "qrcode";
import { createHmacSHA512 } from "../scripts/crypto.js";
import "../styles/CreateQR.css";

function CreateQR({ text, onReset }) {
  const [qrSrc, setQrSrc] = useState("");
  const [generatedHash, setGeneratedHash] = useState("");

  const handleGenerate = async () => {
    if (!text) return;

    try {
      const textNormalisiert = text.replace(/\s+/g, "");
      const hash = createHmacSHA512(textNormalisiert);
      setGeneratedHash(hash);
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
      <div className="qr-preview-text">{text || "Kein Text vorhanden."}</div>

      {!qrSrc ? (
        <button onClick={handleGenerate} className="btn btn-primary">
          🔒 Verschlüsselten QR-Code generieren
        </button>
      ) : (
        <div>
          <div className="qr-box">
            <img src={qrSrc} alt="Generierter QR Code" className="qr-image" />
            <p className="qr-hash">
              <strong>Generierter Hash:</strong>
              <br />
              {generatedHash}
            </p>

            <button onClick={downloadQrCode} className="btn btn-success">
              💾 Als PNG downloaden
            </button>
          </div>

          <div className="qr-actions">
            <button onClick={onReset} className="btn btn-secondary">
              🔄 Neues Dokument ausstellen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateQR;

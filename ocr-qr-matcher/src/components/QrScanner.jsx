import { useEffect, useRef } from "react";
import "../styles/QrScanner.css";

export default function QrScanner({ onScanComplete }) {
  const scannerRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);

  /*
   *       Initialisierung des QR-Scanners:
   *       Bricht einen evtl. noch laufenden Cleanup-Timeout ab, erstellt
   *       (falls noch nicht vorhanden) einen Html5QrcodeScanner und startet
   *       ihn; beim Verlassen der Komponente wird der Scanner verzögert
   *       wieder beendet
   */
  useEffect(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    if (scannerRef.current) return;
    console.log("Scanner wird initialisiert...");
    const html5QrcodeScanner = new window.Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false,
    );

    scannerRef.current = html5QrcodeScanner;

    /*
     *       Erfolgreicher Scan:
     *        Stopp nach erfolgreichem Abschluss des Scans den Ablauf
     *        und übergibt den Inhalt für späteren Abgleich an onScanComplete.
     */
    function onScanSuccess(decodedText) {
      console.log(`QR-Code erfolgreich gescannt! Inhalt: ${decodedText}`);

      html5QrcodeScanner
        .clear()
        .then(() => {
          onScanComplete(decodedText);
        })
        .catch((error) => {
          console.error("Fehler beim Stoppen:", error);
          onScanComplete(decodedText);
        });
    }

    function onScanFailure() {}

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    // Clean-up beim Verlassen der Komponente
    return () => {
      cleanupTimeoutRef.current = setTimeout(() => {
        if (scannerRef.current) {
          console.log("Scanner wird sauber beendet...");
          scannerRef.current
            .clear()
            .catch((err) =>
              console.log("Scanner bereits geschlossen oder nicht aktiv", err),
            );
          scannerRef.current = null;
        }
      }, 50);
    };
  }, [onScanComplete]);

  return (
    <div className="qr-scanner-wrapper">
      <div id="reader" className="qr-scanner-reader"></div>
    </div>
  );
}

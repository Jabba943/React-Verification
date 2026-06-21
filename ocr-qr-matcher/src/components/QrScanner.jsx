import { useEffect, useRef } from "react";

export default function QrScanner({ onScanComplete }) {
  const scannerRef = useRef(null);
  const cleanupTimeoutRef = useRef(null); // Speichert die Verzögerung

  useEffect(() => {
    // Falls React sofort neu startet (StrictMode), brechen wir das geplante Löschen ab!
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // Wenn der Scanner von der ersten Runde noch lebt, nutzen wir ihn einfach weiter
    if (scannerRef.current) return;

    console.log("Scanner wird initialisiert...");

    const html5QrcodeScanner = new window.Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      /* verbose= */ false,
    );

    scannerRef.current = html5QrcodeScanner;

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
          scannerRef.current = null; // Instanz freigeben
        }
      }, 50);
    };
  }, [onScanComplete]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        id="reader"
        style={{
          width: "100%",
          maxWidth: "500px",
          border: "2px solid #333",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#fff",
        }}
      ></div>
    </div>
  );
}

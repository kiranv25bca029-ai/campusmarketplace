import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function UPIScanner({ onScanSuccess }) {

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "upi-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        if (decodedText.startsWith("upi://pay")) {
          onScanSuccess(decodedText);
          scanner.clear();
        } else {
          alert("Invalid UPI QR Code");
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        Scan UPI QR Code
      </h2>

      <div id="upi-reader"></div>
    </div>
  );
}

export default UPIScanner;
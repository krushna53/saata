import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import Recaptcha from "./Recaptcha";

const CertificateForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredParticipants, setRegisteredParticipants] = useState([]);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); // Store PDF preview URL

  const recaptchaRef = useRef(null);

  useEffect(() => {
    fetch("/certificateName.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            try {
              const participants = result.data
                .map((row) => row.Name?.trim())
                .filter(Boolean);
              setRegisteredParticipants(participants);
            } catch (error) {
              console.error("Error processing CSV:", error);
              setError("Failed to load participant data.");
            }
          },
        });
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
        setError("Error loading participant data.");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      setSuccess("");
      return;
    }

    if (!captchaToken) {
      setError("Please verify the reCAPTCHA.");
      setSuccess("");
      return;
    }

    if (
      !registeredParticipants.some(
        (p) => p?.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("You were not a registered participant.");
      setSuccess("");
      return;
    }

    setError("");
    generateCertificate(name);
  };

  const generateCertificate = (userName) => {
    const pdf = new jsPDF("landscape");
    const img = new Image();
    img.src = "/Images/SATAA certificate-2_page-0001.jpg";

    img.onload = () => {
      pdf.addImage(img, "JPEG", 0, 0, 297, 210);
      pdf.setFont("times", "bold");
      pdf.setFontSize(26);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const nameWidth = pdf.getTextWidth(userName);
      const nameX = (pageWidth - nameWidth) / 2.4;
      const nameY = 90;

      pdf.setTextColor(0, 0, 0);
      pdf.text(userName, nameX, nameY);

      // Convert PDF to Blob and create a URL
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
      // ✅ Clear input fields after successful download
      setTimeout(() => {
        setName("");
        setSuccess("");
        setError("");
        setCaptchaToken(null);
        recaptchaRef.current?.resetRecaptcha(); // Reset reCAPTCHA
      }, 2000); // Clears after 2 seconds
    };
  };

  const downloadCertificate = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${name}_certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="certificate container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Generate Your MLL Certificate</h1>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="border p-2 w-full mb-4"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Recaptcha onVerify={setCaptchaToken} />

        <button type="submit" className="submit-btn text-white w-full mt-4">
          Submit
        </button>
      </form>

      {pdfUrl && (
        <div className="mt-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Certificate Preview</h2>
          <iframe
            src={pdfUrl}
            width="100%"
            height="750px"
            className="border rounded shadow-md"
            title="Certificate Preview"
          ></iframe>
          <button
            onClick={downloadCertificate}
            className="download-btn mt-4 text-white"
          >
            Download Certificate
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificateForm;

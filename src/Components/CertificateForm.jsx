import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import Recaptcha from "./Recaptcha";

const CertificateForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [registeredParticipants, setRegisteredParticipants] = useState([]);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); // Store PDF preview URL

  // const recaptchaRef = useRef(null);

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

  const handlePreview = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!captchaToken) {
      setError("Please verify the reCAPTCHA.");
      return;
    }

    if (
      !registeredParticipants.some(
        (p) => p?.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("You are either not a registered participant or your name does not match our records. Kindly ensure that you enter your name exactly as it appears in the records .");
      return;
    }

    setError("");
    generateCertificate(name);
  };

  const generateCertificate = (userName) => {
    const pdf = new jsPDF("landscape");
    const img = new Image();
    img.src = "https://images.ctfassets.net/acxjtojz8lp2/5pXWHLBEqK7wi4xaISKGrc/4e58d2f10db44947f1a0c70abdd09c21/SATAA_certificate-2_page-0001.jpg";

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
    };
  };

  const downloadCertificate = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
  
    if (!captchaToken) {
      setError("Please verify the reCAPTCHA.");
      return;
    }
  
    if (
      !registeredParticipants.some(
        (p) => p?.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("You are either not a registered participant or your name does not match our records. Kindly ensure that you enter your name exactly as it appears in the records .");
      return;
    }
  
    // If the user is a registered participant, allow download
    const pdf = new jsPDF("landscape");
    const img = new Image();
    img.src = "https://images.ctfassets.net/acxjtojz8lp2/5pXWHLBEqK7wi4xaISKGrc/4e58d2f10db44947f1a0c70abdd09c21/SATAA_certificate-2_page-0001.jpg";
  
    img.onload = () => {
      pdf.addImage(img, "JPEG", 0, 0, 297, 210);
      pdf.setFont("times", "bold");
      pdf.setFontSize(26);
  
      const pageWidth = pdf.internal.pageSize.getWidth();
      const nameWidth = pdf.getTextWidth(name);
      const nameX = (pageWidth - nameWidth) / 2.4;
      const nameY = 90;
  
      pdf.setTextColor(0, 0, 0);
      pdf.text(name, nameX, nameY);
  
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
  
      // Create and trigger the download link
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${name}_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Refresh the page after download
      setTimeout(() => {
        window.location.reload(); // Refresh the page after download
      }, 100); // Delay the reload slightly to ensure download has started
    };
  };
  
  

  return (
    <div className="certificate container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Generate Your MLL Certificate</h1>

      {error && <p className="text-red-500 error">{error}</p>}

      <input
        type="text"
        className="border p-2 w-full mb-4"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Recaptcha onVerify={setCaptchaToken} />

      <div className="button-wrapper flex justify-between mt-4">
        <button
          type="button"
          onClick={handlePreview}
          className="preview-btn text-white w-1/2 mr-2"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={downloadCertificate}
          className="download-btn text-white w-1/2 ml-2"
        >
          Download Certificate
        </button>
      </div>
<p className="reach-text">
  Reach out at <a href="mailto:contact@saata.org">contact@saata.org</a> in case of any difficulties in generating the certificate.
</p>

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
        </div>
      )}
    </div>
  );
};

export default CertificateForm;
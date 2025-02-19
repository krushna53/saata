import React, { useState, useEffect,useRef  } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import Recaptcha from "./Recaptcha"; // Import the reCAPTCHA component

const CertificateForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredParticipants, setRegisteredParticipants] = useState([]);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null); // Store a reference to Recaptcha component
  useEffect(() => {
    fetch("/certificateName.csv") // ✅ Load CSV from public folder
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            try {
              const participants = result.data
                .map((row) => row.Name?.trim()) // ✅ Ensure case-insensitive matching
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

    // Verify reCAPTCHA
    // const isCaptchaValid = await verifyRecaptcha(captchaToken);
    // if (!isCaptchaValid) {
    //   setError("reCAPTCHA validation failed. Please try again.");
    //   setSuccess("");
    //   return;
    // }

    // Validate participant name (case-insensitive check)
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

  const verifyRecaptcha = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("reCAPTCHA verification failed:", error);
      return false;
    }
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
      pdf.save(`${userName}_certificate.pdf`);
  
      setSuccess(`Certificate successfully downloaded for ${userName}`);
  
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

        {/* reCAPTCHA Component */}
        <Recaptcha onVerify={setCaptchaToken} />

        <button type="submit" className="submit-btn text-white w-full mt-4">
          Submit
        </button>
      </form>
    </div>
  );
};

export default CertificateForm;

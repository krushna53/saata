import React, { useState } from "react";
import jsPDF from "jspdf";
import ReCAPTCHA from "react-google-recaptcha";

const CertificateForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name) {
      setError("Name is required");
      setSuccess(""); // Clear success message
      return;
    }

    if (!captchaVerified) {
      setError("Please verify the reCAPTCHA.");
      setSuccess(""); // Clear success message
      return;
    }

    // Simulated participant validation
    const registeredParticipants = ["John Doe", "Jane Smith"];

    if (!registeredParticipants.some(participant => participant.toLowerCase() === name.trim().toLowerCase())) {
      setError("You were not a registered participant.");
      setSuccess(""); // Clear success message
      return;
    }

    setError(""); // Clear any errors
    generateCertificate(name);
  };

  const generateCertificate = (userName) => {
    const pdf = new jsPDF("landscape");

    const img = new Image();
    img.src = "/Images/SATAA certificate-2_page-0001.jpg";

    img.onload = () => {
      pdf.addImage(img, "JPEG", 0, 0, 297, 210); // Full certificate background

      pdf.setFont("times", "bold");
      pdf.setFontSize(26);

      // Calculate exact center position based on text width
      const pageWidth = pdf.internal.pageSize.getWidth();
      const nameWidth = pdf.getTextWidth(userName);
      const nameX = (pageWidth - nameWidth) / 2.4; // Center horizontally
      const nameY = 90; // Adjust to be aligned under "This certifies that"

      // Add participant's name in bold
      pdf.setTextColor(0, 0, 0);
      pdf.text(userName, nameX, nameY);

      pdf.save(`${userName}_certificate.pdf`);

      // Show success message after download
      setSuccess(`Certificate successfully downloaded for ${userName}`);
    };
  };

  return (
    <div className="certificate container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Generate Your MLL Certificate</h1>

      {error && <p className="error text-red-500">{error}</p>}
      {success && <p className="success text-green-500">{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="border p-2 w-full mb-4"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Google reCAPTCHA */}
        <ReCAPTCHA
          sitekey="YOUR_GOOGLE_RECAPTCHA_SITE_KEY"
          onChange={() => setCaptchaVerified(true)}
          className="mb-4"
        />

        <button type="submit" className="submit-btn text-white w-full mt-4">
          Submit
        </button>
      </form>
    </div>
  );
};

export default CertificateForm;

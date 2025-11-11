import React, { useState } from "react";

function PreConferenceCertificates() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("Checking certificate...");
    setPreview("");

    const original = name.trim();
    const normalizedUnderscore = original.toLowerCase().replace(/\s+/g, "_");
    const normalizedSpace = original.toLowerCase().replace(/\s+/g, " ");
    const variations = [
      `${normalizedUnderscore}.png`,
      `${normalizedSpace}.png`,
      `${original}.png`
    ];

    const tryNext = (index = 0) => {
      if (index >= variations.length) {
        setMessage("❌ We couldn’t find a certificate matching that name. Please check the name and try again.");
        return;
      }

      const fileName = variations[index];
      const filePath = `${process.env.PUBLIC_URL}/Pre-Conference-Certificates/${fileName}`;
      const img = new Image();

      img.onload = () => {
        setPreview(filePath);
        setMessage("✅ Your Certificate is Ready! Please review the details below.");
      };
      img.onerror = () => tryNext(index + 1);
      img.src = filePath;
    };

    tryNext();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = preview;
    link.download = preview.split("/").pop();
    link.click();
    setMessage("✅ Certificate downloaded successfully!");
    setPreview("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6  w-full max-w-md text-center">
        <h1 className="text-sm md:text-4xl font-bold mb-4 text-[#a37bb6]">
          Download Your SAATA Pre-Conference 2025 Certificates 
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <button
            type="submit"
            className="bg-[#a37bb6] text-white py-2 px-4 rounded "
          >
            Submit
          </button>
        </form>

        {message && (
          <p className="mt-4 text-gray-700 font-medium">{message}</p>
        )}

        {preview && (
          <div className="mt-6 ">
            <img
              src={preview}
              alt="Certificate Preview"
              className="w-full mb-4 border p-4"
            />
            <button
              onClick={handleDownload}
              className="bg-[#a37bb6] text-white py-2 px-4 rounded "
            >
              Download Certificate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreConferenceCertificates;

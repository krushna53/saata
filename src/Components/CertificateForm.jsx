import React, { useState } from "react";
// import ReCAPTCHA from "react-google-recaptcha";

const CertificateForm = () => {
  const [name, setName] = useState("");
  // const [captchaValue, setCaptchaValue] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("Name is required");
      return;
    }
    // if (!captchaValue) {
    //   setError("Please complete the CAPTCHA");
    //   return;
    // }

    // Validate if user was a participant
    // const response = await fetch("/api/validate-participant", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ name }),
    // });
    // const data = await response.json();
    // if (!data.valid) {
    //   setError("You were not a registered participant.");
    //   return;
    // }

    // // Save participant data
    // await fetch("/api/save-participant", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ name, date: new Date().toISOString() }),
    // });

    // Redirect to download certificate
    // window.location.href = `/api/generate-certificate?name=${encodeURIComponent(name)}`;
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Generate Your Certificate</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="border p-2 w-full mb-4"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {/* <ReCAPTCHA sitekey="your-site-key" onChange={setCaptchaValue} /> */}
        <button type="submit" style={{background: 'blue'}}  className=" text-white p-2 w-full mt-4">
          Submit
        </button>
      </form>
    </div>
  );
};

export default CertificateForm;

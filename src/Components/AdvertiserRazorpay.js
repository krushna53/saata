import React, { useState, useEffect } from "react";
const API_BASE = process.env.REACT_APP_API || "http://localhost:5041";
const AdvertiserRazorpay = () => {

  const [formData, setFormData] = useState({
    advertiserName: "",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    adType: "",
    artworkCommit: false,
    termsAccepted: false,
  });

  const [amount, setAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  /* ---------- base prices (exact amounts to charge) ---------- */
  const basePrices = {
    "Back Cover – Colour": 20000,
    "Front Inside Cover – Colour": 15000,
    "Back Inside Cover – Colour": 12000,
    "Full Page – Colour": 10000,
    "Full Page – Black & White": 8000,
    "Half Page – Colour": 6000,
    "Half Page – Black & White": 3500,
    "Quarter Page – Colour": 4000,
    "Quarter Page – Black & White": 2000,
  };

  /* ---------- load Razorpay script once ---------- */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  /* ---------- recalc amount when adType changes (NO GST) ---------- */
  useEffect(() => {
    setAmount(basePrices[formData.adType] || 0);
  }, [formData.adType]);

  /* ---------- helpers ---------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const validEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const required = [
      "advertiserName",
      "contactPerson",
      "designation",
      "email",
      "phone",
      "adType",
    ];
    for (let f of required) {
      if (!formData[f]) return `Please fill the ${f} field.`;
    }
    if (!validEmail(formData.email)) return "Invalid email address.";
    if (!formData.artworkCommit)
      return "Please confirm the artwork commitment.";
    if (!formData.termsAccepted)
      return "Please accept the terms & conditions.";
    if (amount === 0) return "Please choose an advertisement type.";
    return "";
  };

  /* ---------- Razorpay flow ---------- */
  const handlePayment = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setIsSubmitting(true);
    setPaymentSuccess(false);

  try {
  /* 1. create Razorpay order */
  const orderRes = await fetch(
    "https://saataorg.netlify.app/.netlify/functions/createOrder",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },   // ← keep this
      body: JSON.stringify({
        amount: amount * 100,      // paise
        advertiserId: "adv_001",   // ★
        plan: formData.adType,     // ★
      }),
    }
  );

  if (!orderRes.ok) {
    const txt = await orderRes.text();       // Razorpay / Netlify error text
    throw new Error(`Order API error: ${txt}`);
  }

  const order = await orderRes.json();
  if (!order.id) throw new Error("Order creation failed");

  /* 2. launch checkout */
  const rzp = new window.Razorpay({
    key        : process.env.REACT_APP_RAZORPAY_KEY,
    name       : "SAATA Conference 2025 – Advert",
    description: formData.adType,
    order_id   : order.id,
    handler: async (resp) => {
      setPaymentSuccess(true);

      /* 3. payload sent to /storePayment */
      const savePayload = {
        id        : resp.razorpay_payment_id,
        order_id  : order.id,
        amount    : order.amount / 100,   // ₹
        currency  : "INR",
        status    : "success",
        advertiser: { ...formData },
        created_at: new Date().toISOString(),
        notes     : {
          advertiserId: "adv_001",
          plan        : formData.adType,
        },
      };
     // 4. write to Firestore via backend (Netlify Function)
try {
  const saveResponse = await fetch(
    "https://saataorg.netlify.app/.netlify/functions/storePayment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savePayload), // or paymentData—whichever you’re using
    }
  );

  const saveResult = await saveResponse.json();
  if (saveResult.success) {
    reset();            // or resetForm(), if that’s your helper
  } else {
    throw new Error("Payment succeeded but data save failed.");
  }
} catch (error) {
  console.error("❌ Error saving payment:", error);
}

    

          
        },
        prefill: {
          name: formData.contactPerson,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#3399cc" },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
      });

      rzp.on("payment.failed", () => {
        alert("Payment failed. Please try again.");
        setIsSubmitting(false);
      });

      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Payment could not be started. Try again.");
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFormData({
      advertiserName: "",
      contactPerson: "",
      designation: "",
      email: "",
      phone: "",
      adType: "",
      artworkCommit: false,
      termsAccepted: false,
    });
    setAmount(0);
    setIsSubmitting(false);
  };

  /* ---------- JSX ---------- */
  return (
    <div className="flex flex-col-reverse md:flex-row">
      {/* info column */}
      <div className="h-full max-w-2xl p-6 mx-auto">
        <h1 className="text-3xl font-bold text-purple-700">
          SAATA CONFERENCE 2025 – Advertiser Submission
        </h1>
        <p className="mt-4 text-gray-700">
          Conference Dates: <strong>19–21 September 2025</strong>
          <br />
          Location: Hotel Savera, Chennai
        </p>

        <div className="mt-6">
          {/* <h3 className="text-lg font-semibold">Advertisement Rates</h3>
          <ul className="list-disc ml-6 text-gray-700 mt-2 space-y-1">
            {Object.entries(basePrices).map(([label, price]) => (
              <li key={label}>
                {label} – ₹{price.toLocaleString("en-IN")}
              </li>
            ))}
          </ul> */}
          <h3 className="mt-6 text-lg font-semibold">Artwork Guidelines</h3>
          <p className="text-gray-700 mt-2">
            • Full Page 8 × 10 in  •  Half Page 8 × 5 in  •  Quarter Page 3.5 × 4.8 in
            <br />
            300 DPI • PDF / JPEG / PNG • Send by 15 Aug 2025 to
            <a
              href="mailto:saata-ads@gmail.com"
              className="text-blue-600 underline"
            >
              {" "}
              saata-ads@gmail.com
            </a>
          </p>
          <h3 className="mt-6 text-lg font-semibold">Terms & Conditions</h3>
          <p className="text-gray-700 mt-2">
            • Payments are non‑refundable. <br />
            • Missing artwork after 15 Aug 2025 = cancellation without refund.{" "}
            <br />
            • SAATA may decline artwork that fails technical/content specs.
          </p>
        </div>
      </div>

      {/* form column */}
      <div className="relative max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        <form
          className="sticky top-0 h-min"
          onSubmit={(e) => {
            e.preventDefault();
            handlePayment();
          }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Advertiser Details
          </h2>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <input
              name="advertiserName"
              value={formData.advertiserName}
              onChange={handleChange}
              className="input-field"
              placeholder="Advertiser / Company Name"
              required
            />
            <input
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="input-field"
              placeholder="Contact Person"
              required
            />
            <input
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="input-field"
              placeholder="Designation / Role"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Email"
              required
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Phone Number"
              pattern="[0-9]+"
              title="Numbers only"
              required
            />
            <select
              name="adType"
              value={formData.adType}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select Advertisement Type</option>
              {Object.keys(basePrices).map((label) => (
                <option key={label} value={label}>
                  {label} – ₹{basePrices[label].toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          {/* artwork & terms checkboxes */}
          <div className="mt-4 space-y-2">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="artworkCommit"
                checked={formData.artworkCommit}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                I will email the artwork to&nbsp;
                <a
                  href="mailto:saata-ads@gmail.com"
                  className="text-blue-600 underline"
                >
                  saata-ads@gmail.com
                </a>{" "}
                on or before 15&nbsp;Aug&nbsp;2025.
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="mt-1"
              />
              <span>I have read and agree to the terms &amp; conditions.</span>
            </label>
          </div>

          <span className="p-2 bg-slate-100 flex justify-center items-center mt-4">
            Total&nbsp;to&nbsp;Pay: ₹{amount.toLocaleString("en-IN")}
          </span>

          {error && (
            <div className="error w-full text-red-600 mt-4 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 text-white font-bold rounded-lg mt-4 transition ${
              isSubmitting || amount === 0
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isSubmitting || amount === 0}
          >
            {isSubmitting ? "Processing…" : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvertiserRazorpay;

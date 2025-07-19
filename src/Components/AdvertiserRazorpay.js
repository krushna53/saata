import React, { useState, useEffect } from "react";

// 🔧 Direct API base for deploy-preview (Netlify Functions)
// const API_BASE = "https://deploy-preview-77--saataorg.netlify.app/.netlify/functions";
// 🔧 Your Razorpay Public Key (test or live)
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;//"rzp_test_eyzRpteMFBKUjv"; // Replace with your actual Razorpay key

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

  const basePrices = {
    "Standee": 25000,
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
  const adLimits = {
  "Back Cover – Colour": 1,
  "Front Inside Cover – Colour": 1,
  "Back Inside Cover – Colour": 5,
};

const [adBookings, setAdBookings] = useState({});

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
  const baseTotal = basePrices[formData.adType] || 0;
  const gstAmount = Math.round(baseTotal * 0.18); // 18% GST
  const totalWithGST = baseTotal + gstAmount;
  setAmount(totalWithGST); // Total = base + GST
}, [formData.adType]);

useEffect(() => {
  const fetchAdBookings = async () => {
    try {
      const res = await fetch(`https://deploy-preview-77--saataorg.netlify.app/.netlify/functions/adBookings`);
      const data = await res.json();
      console.log("Plan A Count:", data.PlanA || 0);
      console.log("Plan B Count:", data.PlanB || 0);
      setAdBookings(data);
    } catch (err) {
      console.error("Failed to fetch ad bookings", err);
    }
  };
  fetchAdBookings();
}, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const requiredFields = [
      "advertiserName",
      "contactPerson",
      "designation",
      "email",
      "phone",
      "adType",
    ];
    for (let field of requiredFields) {
      if (!formData[field]) return `Please fill the ${field} field.`;
    }
    if (!validEmail(formData.email)) return "Invalid email address.";
    if (!formData.artworkCommit) return "Please confirm the artwork commitment.";
    if (!formData.termsAccepted) return "Please accept the terms & conditions.";
    if (amount === 0) return "Please choose an advertisement type.";
    return "";
  };

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
    const orderRes = await fetch(`https://deploy-preview-77--saataorg.netlify.app/.netlify/functions/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          advertiserId: "adv_001",
          plan: formData.adType,
        }),
      });

      if (!orderRes.ok) {
        const txt = await orderRes.text();
        throw new Error(`Order API error: ${txt}`);
      }

      const order = await orderRes.json();
      if (!order.id) throw new Error("Order creation failed");

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        name: "SAATA Conference 2025 – Advertiser",
        description: formData.adType,
        order_id: order.id,
        prefill: {
          name: formData.contactPerson,
          email: formData.email,
          contact: formData.phone,
        },
       handler: async (resp) => {
       setPaymentSuccess(true);

  const savePayload = {
    id: resp.razorpay_payment_id,
    order_id: order.id,
    amount: order.amount / 100,
    currency: "INR",
    status: "success",
    advertiser: formData,
    created_at: new Date().toISOString(),
    notes: {
      advertiserId: "adv_001",
      plan: formData.adType,
    },
  };

 const saveResponse = await fetch(`https://deploy-preview-77--saataorg.netlify.app/.netlify/functions/storePayment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(savePayload),
  });

  const saveResult = await saveResponse.json();

  if (saveResult.success) {
    setAdBookings(prev => ({
      ...prev,
      [formData.adType]: (prev[formData.adType] || 0) + 1
    }));

    reset(); // ✅ Only added this part
  } else {
    throw new Error("Payment succeeded but data save failed.");
  }
},

        
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
        theme: { color: "#3399cc" },
      });

      rzp.on("payment.failed", () => {
        alert("Payment failed. Please try again.");
        setIsSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="flex flex-col-reverse md:flex-row">
      <div className="h-full max-w-2xl p-6 mx-auto">
        <h1 className="text-3xl font-bold text-purple-700">
          SAATA CONFERENCE 2025 – Advertiser Submission
        </h1>
        <p className="mt-4 text-gray-700">
          Conference Dates: <strong>19–21 September 2025</strong>
          <br />
          Location: <strong> Hotel Savera, Chennai </strong>
        </p>

        <h3 className="mt-6 text-lg font-semibold">Artwork Guidelines</h3>
<p className="text-gray-700 mt-2">
  Note: Ad Sizes for Reference (in inches)<br />
  The Kaleidoscope Journal will be printed in <strong>8.5 x 11 inches</strong>.<br /><br />
</p>
<div className="text-gray-700 text-sm space-y-1">
  <div className="flex justify-between max-w-sm">
    <span>Ad Type</span>
    <span>Artwork Size (W x H)</span>
  </div>
  <div className="flex justify-between max-w-sm">
    <span>Full Page</span>
    <span>8 x 10 in</span>
  </div>
  <div className="flex justify-between max-w-sm">
    <span>Half Page</span>
    <span>8 x 5 in</span>
  </div>
  <div className="flex justify-between max-w-sm">
    <span>Quarter Page</span>
    <span>3.5 x 4.8 in</span>
  </div>
</div>
<p className="text-gray-700 mt-3">
  Please ensure your artwork matches the selected dimensions and is <strong>300 DPI</strong>,
  in <strong>PDF, JPEG, or PNG</strong> format.
</p>
<h3 className="mt-6 text-lg font-semibold">Standee Guidelines</h3>
<p className="text-gray-700 mt-2">
  • Size: <strong>5ft x 2ft</strong><br />
  • Standee to be provided by the sponsor by <strong>15th September 2025</strong><br />
  • Standee will be placed at prominent locations during the event to maximise visibility.
</p>

        <h3 className="mt-6 text-lg font-semibold">Terms & Conditions</h3>
        <p className="text-gray-700 mt-2">
          • All payments are non-refundable. <br />
          • Non-receipt of artwork by 15th August 2025 will be considered a cancellation without refund. <br />
          • SAATA reserves the right to decline artwork that does not meet technical or content guidelines.
        </p>
      </div>

      <div className="relative max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        <form
          className="sticky top-0 h-min"
          onSubmit={(e) => {
            e.preventDefault();
            handlePayment();
          }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Advertiser Details</h2>
          <p className="text-gray-700 mt-2 mb-3">
       Thank you for your interest in advertising in our official<strong> SAATA Conference 2025 Booklet. </strong>
      Please fill in the following details to confirm your advertisement placement.
      </p>


          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <input name="advertiserName" value={formData.advertiserName} onChange={handleChange} className="input-field" placeholder="Advertiser / Company Name" required />
            <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="input-field" placeholder="Contact Person" required />
            <input name="designation" value={formData.designation} onChange={handleChange} className="input-field" placeholder="Designation / Role" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Email" required />
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="Phone Number" pattern="[0-9]+" title="Numbers only" required />
      <select
  name="adType"
  value={formData.adType}
  onChange={handleChange}
  className="input-field"
  required
>
  <option value="">Select Advertisement Type</option>
  {Object.entries(basePrices).map(([label, price]) => {
    const booked = adBookings[label] >= (adLimits[label] || Infinity);
    return (
      <option key={label} value={label} disabled={booked}>
        {label} – ₹{price.toLocaleString("en-IN")} {booked ? "(Booked)" : ""}
      </option>
    );
  })}
</select>

          </div>

          <div className="mt-4 space-y-2">
            <h3 className="mt-6 text-lg font-semibold">Artwork Commitment</h3>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="artworkCommit" checked={formData.artworkCommit} onChange={handleChange} className="mt-1" />
              <span>
                I confirm that I will email the artwork for the advertisement{" "}
                <a href="mailto:saata.advertise@gmail.com" className="text-blue-600 underline">
                  saata.advertise@gmail.com
                </a>{" "}
                on or before 15 Aug 2025.
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1" />
              <span>I have read and agree to the terms & conditions.</span>
            </label>
          </div>

        <span className="p-2 bg-slate-100 text-center flex items-center justify-center">
                  Total (incl. 18% GST): ₹{amount.toLocaleString("en-IN")}
                </span>
          {error && <div className="error w-full text-red-600 mt-4 text-center">{error}</div>}

          <button
            type="submit"
            className={`w-full py-3 text-white font-bold rounded-lg mt-4 transition ${
              isSubmitting || amount === 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isSubmitting || amount === 0}
          >
            {isSubmitting ? "Processing…" : "Pay Now"}
          </button>
           {paymentSuccess && (
                <p className="text-[#9cca3b] font-semibold mt-2 text-center">
                  Payment successful! Thank you.
                </p>
              )}       
        </form>
      </div>
    </div>
  );
};

export default AdvertiserRazorpay;

import React, { useState, useEffect } from "react";

const RazorpayButton = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    organization: "",
    designation: "",
    saataMember: "",
    saataStudent: "",
    membershipType: "",
    yearsTraining: "",
    trainerName: "",
    expectations: "",
    heardFrom: "",
  });

  const [amount, setAmount] = useState(8000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || amount === 0) {
      alert("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/.netlify/functions/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const orderData = await response.json();
      if (!orderData || !orderData.id) throw new Error("Failed to create order");

      const options = {
        key: "rzp_test_eyzRpteMFBKUjv",
        amount: orderData.amount,
        currency: "INR",
        name: "Event Registration",
        order_id: orderData.id,
        handler: async function (response) {
          const paymentData = {
            id: response.razorpay_payment_id,
            order_id: orderData.id,
            amount: orderData.amount,
            currency: "INR",
            status: "success",
            email: formData.email,
            contact: formData.phone,
            method: "Razorpay",
            notes: {
              organization: formData.organization,
              designation: formData.designation,
              saataMembership: formData.saataMember,
              saataStudent: formData.saataStudent,
              typeOfMembership: formData.membershipType,
            },
            created_at: new Date().toISOString(),
          };

          try {
            const saveResponse = await fetch(
              "https://saataorg.netlify.app/.netlify/functions/storePayment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
              }
            );

            const saveResult = await saveResponse.json();
            if (saveResult.success) {
              alert("Payment Successful! Data saved.");
              resetForm();
            } else {
              throw new Error("Payment succeeded but data save failed.");
            }
          } catch (error) {
            console.error("❌ Error saving payment:", error);
            alert("Payment succeeded, but there was an issue saving the data.");
          }
        },
        prefill: { ...formData },
        theme: { color: "#3399cc" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      qualification: "",
      organization: "",
      designation: "",
      saataMember: "",
      saataStudent: "",
      membershipType: "",
      yearsTraining: "",
      trainerName: "",
      expectations: "",
      heardFrom: "",
    });
    setAmount(8000);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Conference Registration</h2>

      <div className="space-y-4">
        <input type="text" name="name" value={formData.name} placeholder="Name" className="input-field" onChange={handleChange} required />
        <input type="text" name="organization" value={formData.organization} placeholder="Organization" className="input-field" onChange={handleChange} required />
        <input type="text" name="designation" value={formData.designation} placeholder="Designation" className="input-field" onChange={handleChange} required />
        <input type="email" name="email" value={formData.email} placeholder="Email" className="input-field" onChange={handleChange} required />
        <input type="tel" name="phone" value={formData.phone} placeholder="Phone" className="input-field" onChange={handleChange} required />

        {/* SAATA Member Dropdown */}
        <div>
          <p className="font-semibold">SAATA Member:</p>
          <select name="saataMember" value={formData.saataMember} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="yes">YES</option>
            <option value="no">NO</option>
          </select>
        </div>

        {/* SAATA Student Dropdown */}
        <div>
          <p className="font-semibold">SAATA Student:</p>
          <select name="saataStudent" value={formData.saataStudent} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="yes">YES</option>
            <option value="no">NO</option>
          </select>
        </div>

        {/* Membership Type Dropdown */}
        <div>
          <p className="font-semibold">Type of Membership:</p>
          <select name="membershipType" value={formData.membershipType} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="Not Applicable">Not Applicable</option>
            <option value="Associate Member">Associate Member</option>
            <option value="Trainee Member">Trainee Member</option>
            <option value="Certified Member">Certified Member</option>
            <option value="Life Member">Life Member</option>
          </select>
        </div>

        <div className="text-lg font-semibold text-gray-700 p-3 border rounded-md bg-gray-100">Total: ₹{amount.toLocaleString("en-IN")}</div>

        <button onClick={handlePayment} className={`w-full py-3 text-white font-bold rounded-lg transition ${isSubmitting || amount === 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`} disabled={isSubmitting || amount === 0}>
          {isSubmitting ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
};

export default RazorpayButton;

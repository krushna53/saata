import React, { useState, useEffect } from "react";

const RazorpayButton = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    gender: "",
    qualification: "",
    occupation: "",
    organization: "",
    delegateType: "",
    participation: "",
    pricingCategory: "Super Early Bird", // Default to Super Early Bird
  });

  const [amount, setAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    calculateAmount();
  }, [formData.delegateType, formData.participation, formData.pricingCategory]);
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

  const calculateAmount = () => {
    const pricing = {
      "Super Early Bird": {
        "SAATA Member": { pre: 2500, conf: 7500, both: 8500 },
        "Non-SAATA Member": { pre: 3500, conf: 8500, both: 11000 },
        "Student(fulltime)": { pre: 2500, conf: 6500, both: 8000 },
      },
      "Early Bird": {
        "SAATA Member": { pre: 3000, conf: 7500, both: 10500 },
        "Non-SAATA Member": { pre: 4000, conf: 8500, both: 12500 },
        "Student(fulltime)": { pre: 2500, conf: 6500, both: 8000 },
      },
      Regular: {
        "SAATA Member": { pre: 4000, conf: 8500, both: 12500 },
        "Non-SAATA Member": { pre: 5000, conf: 9500, both: 13500 },
        "Student(fulltime)": { pre: 2500, conf: 6500, both: 8000 },
      },
    };

    const category = pricing[formData.pricingCategory] || {};
    const delegate = category[formData.delegateType] || {};
    const total = delegate[formData.participation] || 0;

    // Adding 18% GST
    setAmount(Math.round(total * 1.18));
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
      if (!orderData || !orderData.id)
        throw new Error("Failed to create order");

      const options = {
        key: "rzp_test_eyzRpteMFBKUjv",
        amount: orderData.amount,
        currency: "INR",
        name: "Event Registration",
        order_id: orderData.id,
        handler: async function (response) {
          alert("Payment Successful!");
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
              age: formData.age,
              gender: formData.gender,
              qualification: formData.qualification,
              occupation: formData.occupation,
              organization: formData.organization,
              designation: formData.designation,
              saataMembership: formData.saataMember,
              saataStudent: formData.saataStudent,
              typeOfMembership: formData.membershipType,
              delegateType: formData.delegateType,
              participation: formData.participation,
              pricingCategory: formData.pricingCategory
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
              // alert("Payment Successful! Data saved.");
              resetForm();
            } else {
              throw new Error("Payment succeeded but data save failed.");
            }
          } catch (error) {
            console.error("❌ Error saving payment:", error);
            // alert("Payment succeeded, but there was an issue saving the data.");
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
      address: "",
      age: "",
      gender: "",
      qualification: "",
      occupation: "",
      organization: "",
      delegateType: "",
      participation: "",
      pricingCategory: "Super Early Bird",
    });
    setAmount(0);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Conference Registration
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          placeholder="Name"
          className="input-field"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          placeholder="Email"
          className="input-field"
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          placeholder="Phone"
          className="input-field"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          value={formData.address}
          placeholder="Address"
          className="input-field"
          onChange={handleChange}
        />
        <input
          type="number"
          name="age"
          value={formData.age}
          placeholder="Age"
          className="input-field"
          onChange={handleChange}
        />
        <input
          type="text"
          name="gender"
          value={formData.gender}
          placeholder="Gender"
          className="input-field"
          onChange={handleChange}
        />
        <input
          type="text"
          name="qualification"
          value={formData.qualification}
          placeholder="Qualification"
          className="input-field"
          onChange={handleChange}
        />
        <input
          type="text"
          name="occupation"
          value={formData.occupation}
          placeholder="Occupation"
          className="input-field"
          onChange={handleChange}
        />
        <input
          type="text"
          name="organization"
          value={formData.organization}
          placeholder="Organization"
          className="input-field"
          onChange={handleChange}
        />

        <div>
          <p className="font-semibold">Delegate Type:</p>
          <select
            name="delegateType"
            value={formData.delegateType}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select</option>
            <option value="SAATA Member">SAATA Member</option>
            <option value="Non-SAATA Member">Non-SAATA Member</option>
            <option value="Student(fulltime)">Student(fulltime)</option>
          </select>
        </div>

        <div>
          <p className="font-semibold">Pricing Category:</p>
          <select
            name="pricingCategory"
            value={formData.pricingCategory}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Super Early Bird">Super Early Bird</option>
            <option value="Early Bird">Early Bird</option>
            <option value="Regular">Regular</option>
          </select>
        </div>

        <div>
          <p className="font-semibold">Dates of Participation:</p>
          <select
            name="participation"
            value={formData.participation}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select</option>
            <option value="pre">Pre-Conference Institute (19 Sep)</option>
            <option value="conf">Conference (20 & 21 Sep)</option>
            <option value="both">Both (19 - 21 Sep)</option>
          </select>
        </div>

        <div className="text-lg font-semibold text-gray-700 p-3 border rounded-md bg-gray-100">
          Total: ₹{amount.toLocaleString("en-IN")}
        </div>

        <button
          onClick={handlePayment}
          className={`w-full py-3 text-white font-bold rounded-lg transition ${
            isSubmitting || amount === 0
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={isSubmitting || amount === 0}
        >
          {isSubmitting ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
};

export default RazorpayButton;

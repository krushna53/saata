import React, { useState, useEffect } from "react";
import { ref, set } from "firebase/database";
import { auth, database } from "../Firebase";

const RazorpayButton = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    saataMember: "",
    yearsTraining: "",
    trainerName: "",
    expectations: "",
    heardFrom: "",
  });

  const [conferenceType, setConferenceType] = useState("");
  const [membershipType, setMembershipType] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [amount, setAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing Data
  const pricing = {
    conf: {
      member: { super_early: 5000, early: 6000 },
      non_member: { super_early: 7000, early: 8000 },
    },
    pre_conf: {
      member: { super_early: 3000, early: 4000 },
      non_member: { super_early: 5000, early: 6000 },
    },
    conf_plus_inst: {
      member: { super_early: 8000, early: 9000 },
      non_member: { super_early: 10000, early: 11000 },
    },
  };

  // Calculate price dynamically
  useEffect(() => {
    if (conferenceType && membershipType && ticketType) {
      setAmount(pricing[conferenceType]?.[membershipType]?.[ticketType] || 0);
    }
  }, [conferenceType, membershipType, ticketType]);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate Form Before Payment
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || amount === 0) {
      alert("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  // Save Payment Details to Firebase
  const savePaymentToFirebase = (
    paymentData,
    formData,
    conferenceType,
    membershipType,
    ticketType
  ) => {
    if (!auth.currentUser) {
      console.error("User not authenticated, cannot save data.");
      return;
    }

    const userId = auth.currentUser.uid;

    set(
      ref(database, `payments/${userId}/${paymentData.razorpay_payment_id}`),
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        conferenceType: conferenceType.replace("_", " "),
        membershipType: membershipType.replace("_", " "),
        ticketType: ticketType.replace("_", " "),
        amount: paymentData.amount,
        currency: "INR",
        paymentId: paymentData.razorpay_payment_id,
        orderId: paymentData.order_id,
        status: "Paid",
        timestamp: new Date().toISOString(),
      }
    )
      .then(() => {
        console.log("Payment saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving payment:", error);
      });
  };

  // Handle Payment Process
  const handlePayment = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/create-order", {
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
          const paymentData = {
            razorpay_payment_id: response.razorpay_payment_id,
            order_id: orderData.id,
            amount: orderData.amount,
          };

          // Save payment details to Firebase
          savePaymentToFirebase(paymentData);

          alert("Payment Successful!");
          resetForm();
        },
        prefill: { ...formData },
        notes: {
          conferenceType: conferenceType.replace("_", " "),
          membershipType: membershipType.replace("_", " "),
          ticketType: ticketType.replace("_", " "),
          totalAmount: amount,
        },
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

  // Reset form after successful payment
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      qualification: "",
      saataMember: "",
      yearsTraining: "",
      trainerName: "",
      expectations: "",
      heardFrom: "",
    });
    setConferenceType("");
    setMembershipType("");
    setTicketType("");
    setAmount(0);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Conference Registration
      </h2>

      <div className="space-y-4">
        {/* Name */}
        <input
          type="text"
          name="name"
          value={formData.name}
          placeholder="Name"
          className="input-field"
          onChange={handleChange}
          required
        />
        {/* Email */}
        <input
          type="email"
          name="email"
          value={formData.email}
          placeholder="Email"
          className="input-field"
          onChange={handleChange}
          required
        />
        {/* Phone */}
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          placeholder="Phone"
          className="input-field"
          onChange={handleChange}
          required
        />

        {/* Conference Type */}
        <div>
          <p className="font-semibold">Select Conference Type:</p>
          {["conf", "pre_conf", "conf_plus_inst"].map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="conferenceType"
                value={value}
                checked={conferenceType === value}
                onChange={(e) => setConferenceType(e.target.value)}
              />
              {value.replace("_", " ")}
            </label>
          ))}
        </div>

        {/* Membership Type */}
        <div>
          <p className="font-semibold">Select Membership Type:</p>
          {["member", "non_member"].map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="membershipType"
                value={value}
                checked={membershipType === value}
                onChange={(e) => setMembershipType(e.target.value)}
              />
              {value.replace("_", " ")}
            </label>
          ))}
        </div>
        {/* Ticket Type */}
        <div>
          <p className="font-semibold">Select Ticket Type:</p>
          {["super_early", "early"].map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="ticketType"
                value={value}
                checked={ticketType === value}
                onChange={(e) => setTicketType(e.target.value)}
              />
              {value.replace("_", " ")}
            </label>
          ))}
        </div>
        {/* Amount Display */}
        <div className="text-lg font-semibold text-gray-700 p-3 border rounded-md bg-gray-100">
          Total: ₹{amount.toLocaleString("en-IN")}
        </div>

        {/* Payment Button */}
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

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
    pricingCategory: "Super Early Bird",
    instituteOption: "", // New field for institute selection
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
    const pricingWithoutGST = {
      "Super Early Bird": {
        "SAATA Member": { pre: 2500, conf: 7000, both: 8500 },
        "Non-SAATA Member": { pre: 3500, conf: 8500, both: 11000 },
        "Student(Fulltime)": { pre: 2500, conf: 6500, both: 8000 },
      },
      "Early Bird": {
        "SAATA Member": { pre: 3000, conf: 7500, both: 10500 },
        "Non-SAATA Member": { pre: 3500, conf: 8500, both: 12500 },
        "Student(Fulltime)": { pre: 2500, conf: 6500, both: 8000 },
      },
      Regular: {
        "SAATA Member": { pre: 4000, conf: 8300, both: 11300 },
        "Non-SAATA Member": { pre: 5000, conf: 9500, both: 13500 },
        "Student(Fulltime)": { pre: 2500, conf: 6500, both: 8000 },
      },
    };

    const category = pricingWithoutGST[formData.pricingCategory] || {};
    const delegate = category[formData.delegateType] || {};
    const baseTotal = delegate[formData.participation] || 0;

    // Apply 18% GST
    const totalWithGST = Math.round(baseTotal * 1.18);

    setAmount(totalWithGST);
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || amount === 0) {
      alert("Please fill in all required fields.");
      return false;
    }
    // Validate institute option if pre-conference or both is selected
    if ((formData.participation === 'pre' || formData.participation === 'both') && !formData.instituteOption) {
      // alert("Please select an institute option.");
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
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: orderData.amount,
        currency: "INR",
        name: "Event Registration",
        order_id: orderData.id,
        handler: async function (response) {
          console.log("Payment Successful!");
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
              pricingCategory: formData.pricingCategory,
              instituteOption: formData.instituteOption // Add institute option to payment data
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
              resetForm();
            } else {
              throw new Error("Payment succeeded but data save failed.");
            }
          } catch (error) {
            console.error("❌ Error saving payment:", error);
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
  const currentDate = new Date();
  const cutoffDate = new Date('2025-03-27T00:01:00'); // 27th March 1 AM
  const showSAATAMemberOnly = currentDate < cutoffDate;
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
      instituteOption: "", // Reset institute option
    });
    setAmount(0);
    setIsSubmitting(false);
  };

  // Show institute options only when pre-conference or both is selected
  const showInstituteOptions = formData.participation === 'pre' || formData.participation === 'both';

  return (
    <>
      <div className="block md:flex">
        <div className="md:w-1/2 max-w-lg mx-auto p-6 bg-white">
          <h1 className="text-2xl font-bold text-[#a37bb6]">SAJTA Workshop-Mark Widdowson’s Protocol</h1>
          <div className="pt-8">
            <h2 className="text-xl font-semibold">Introduction to Mark Widdowson’s Protocol for Case Study Research</h2>
          </div>

          <p className="font-bold mt-[3rem] mb-2">Facilitator: Aruna Gopakumar</p>
          <p className="mt-1"><span className="font-semibold">April 7th, 6:30 to 8:00 PM via Zoom</span></p>
          <p className="mt-1 font-semibold">Last date for registration 6th April</p>
          <p className="mt-1 font-bold">Fee: Rs.500/-</p>

          <p className="mt-[3rem] text-gray-700">
            This 90-minute SAJTA workshop introduces Mark Widdowson’s protocol for case study research, a rigorous qualitative method for evaluating therapeutic effectiveness. Led by Aruna Gopakumar, the session covers key tools, ethical considerations, and the process of transforming case records into publishable studies. Join us to learn, reflect, and honor Mark’s legacy.
          </p>

          <div className="mt-[3rem]">
            <h3 className="font-semibold contact-us">Contact Us:</h3>
            <p className="flex items-center mt-1 email"> <a href="mailto:contact@saata.org" className="text-blue-600 ml-2">contact@saata.org</a></p>
            <p className="flex items-center mt-1 phone"> <a href="tel:+919886229987" className="text-blue-600 ml-2">+91 9886229987</a></p>
          </div>

          <div className="mt-[4rem]">
            <h3 className="font-semibold">Terms & Conditions:</h3>
            <p className="text-gray-700">You agree to share information entered on this page with SAATA (owner of this page) and Razorpay, adhering to applicable laws.</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Conference Registration</h2>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <input type="text" name="name" value={formData.name} placeholder="First Name/ Last Name" className="input-field" onChange={handleChange} required />
            <input type="email" name="email" value={formData.email} placeholder="Email" className="input-field" onChange={handleChange} required />
            <input type="number" name="phone" value={formData.phone} placeholder="Phone Number" className="input-field" onChange={handleChange} pattern="[0-9]+" title="Only numbers allowed" required />
            <input type="number" name="age" value={formData.age} placeholder="Age" className="input-field" onChange={handleChange} min="1" required />
            <input type="text" name="gender" value={formData.gender} placeholder="Gender" className="input-field" onChange={handleChange} required />
            <input type="text" name="qualification" value={formData.qualification} placeholder="Qualification" className="input-field" onChange={handleChange} required />
            <input type="text" name="occupation" value={formData.occupation} placeholder="Occupation" className="input-field" onChange={handleChange} required />
            <input type="text" name="organization" value={formData.organization} placeholder="Organization" className="input-field" onChange={handleChange} required />
          </div>
          <div className="mt-4">
            <textarea type="text" name="address" value={formData.address} placeholder="Address" className="input-field" onChange={handleChange} required />
          </div>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <div className="mt-4">
              <p className="font-semibold">Delegate Type:</p>
              <select name="delegateType" value={formData.delegateType} onChange={handleChange} defaultValue="SAATA Member" className="input-field">
                <option value="">Select</option>
                {showSAATAMemberOnly ? (
                  <option value="SAATA Member">SAATA Member</option>
                ) : (
                  <>
                    <option value="SAATA Member">SAATA Member</option>
                    <option value="Non-SAATA Member">Non-SAATA Member</option>
                    <option value="Student(Fulltime)">Student(Fulltime)</option>
                  </>
                )}
              </select>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Pricing Category:</p>
              <select name="pricingCategory" value={formData.pricingCategory} onChange={handleChange} className="input-field">
                {showSAATAMemberOnly ? (
                  <option value="Super Early Bird">Super Early Bird (Until March 26)</option>
                ) : (
                  <>
                    <option value="Super Early Bird">Super Early Bird (Until March 26)</option>
                    <option value="Early Bird">Early Bird (Until April 10)</option>
                    <option value="Regular">Regular (Until July 10)</option>
                  </>
                )}
              </select>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Dates of Participation:</p>
              <select name="participation" value={formData.participation} onChange={handleChange} className="input-field">
                <option value="">Select</option>
                <option value="pre">Pre-Conference Institute (19 Sep)</option>
                <option value="conf">Conference (20 & 21 Sep)</option>
                <option value="both">Both (19 - 21 Sep)</option>
              </select>
            </div>
            <span className="p-2 bg-slate-100 text-center flex items-center justify-center">
              Total (incl. 18% GST): ₹{amount.toLocaleString("en-IN")}
            </span>
          </div>

          {showInstituteOptions && (
            <div className="mt-4">
              <p className="font-semibold">Select Institute Option:</p>
              <select
                name="instituteOption"
                value={formData.instituteOption}
                onChange={handleChange}
                className="input-field w-full"
                required
              >
                <option value="">Select an Institute</option>
                <option value="institute1">Working with Couples and Relationships - P K Saru</option>
                <option value="institute2">Transactional Analysis and Trauma - Karen Minikin</option>
                <option value="institute3">Transactional Analysis and Groups - C Suriyaprakash</option>
                <option value="institute4">Transactional Analysis and Organizations - Sashi Chandran</option>
              </select>
            </div>
          )}

          <button
            onClick={handlePayment}
            className={`w-full py-3 text-white font-bold rounded-lg mt-4 transition ${isSubmitting || amount === 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            disabled={isSubmitting || amount === 0}
          >
            {isSubmitting ? "Processing..." : "Pay Now"}
          </button>
          {isSubmitting === false && formData.name && (
            <p className="text-green-600 font-semibold mt-2 text-center">
              Payment successful! Thank you for registering.
            </p>
)}
        </div>
      </div>
    </>
  );
};

export default RazorpayButton;
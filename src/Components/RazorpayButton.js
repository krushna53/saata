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
    pricingCategory: "Regular", // Default to "Regular"
    instituteOption: "", // New field for institute selection
  });

  const [amount, setAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        "SAATA Member": { pre_conference: 2500, conference: 7000, both: 8500 },
        "Non-SAATA Member": { pre_conference: 3500, conference: 8500, both: 11000 },
        "Student(Fulltime)": { pre_conference: 2500, conference: 6500, both: 8000 },
      },
      "Early Bird": {
        "SAATA Member": { pre_conference: 3000, conference: 7500, both: 9500 },
        "Non-SAATA Member": { pre_conference: 3500, conference: 8500, both: 11000 },
        "Student(Fulltime)": { pre_conference: 2500, conference: 6500, both: 8000 },
      },
      "Regular": {
        "SAATA Member": { pre_conference: 4000, conference: 8300, both: 11300 },
        "Non-SAATA Member": { pre_conference: 5000, conference: 9500, both: 13500 },
        "Student(Fulltime)": { pre_conference: 2500, conference: 6500, both: 8000 },
      },
    };

    const category = pricingWithoutGST[formData.pricingCategory] || {};
    const delegate = category[formData.delegateType] || {};
    const baseTotal = delegate[formData.participation] || 0;

    // Apply 18% GST
    const totalWithGST = Math.round(baseTotal * 1.18);

    setAmount(totalWithGST);
  };

  function valid(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  const validateForm = () => {
    const requiredFields = [
      "name",
      "email",
      "phone",
      "address",
      "age",
      "gender",
      "qualification",
      "occupation",
      "organization",
      "delegateType",
      "participation",
      "pricingCategory"
    ];
    for (let field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in the ${field} field.`);
        return false;
      }
    }

    if (!formData.name || !formData.email || !formData.phone || amount === 0) {
      setError("Please fill in all fields.");
      return;
    }
    if (!valid(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    // Validate institute option if pre-conference or both is selected
    if ((formData.participation === 'pre' || formData.participation === 'both') && !formData.instituteOption) {
      return false;
    }
    return true;
  };

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const institutes = [
    "The Mythic Journey: Myths and Paths to Self | Aruna Gopakumar & Samhita Arni",
    "Transitions, Transformations, and Everything In-Between | Rosemary Kurian & Radhika Layer",
    "Physis at the Core: An Integrative Approach to Developmental Practice | C. Suriyaprakash",
    "Power, Authority, and Leadership (PAL) in Organizations | Gunjan Zutshi & Deepak Dhananjaya"
  ];

  const handlePayment = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setPaymentSuccess(false);

    try {
      const response = await fetch("https://saataorg.netlify.app/.netlify/functions/createOrder", {
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
          setPaymentSuccess(true);

          const paymentData = {
            id: response.razorpay_payment_id,
            order_id: orderData.id,
            amount: orderData.amount / 100,
            currency: "INR",
            status: "success",
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
            method: "Razorpay",
            notes: {
              age: formData.age,
              gender: formData.gender,
              qualification: formData.qualification,
              occupation: formData.occupation,
              organization: formData.organization,
              delegateType: formData.delegateType,
              participation: formData.participation,
              pricingCategory: formData.pricingCategory,
              instituteOption: formData.instituteOption, // Add institute option to payment data
              address: formData.address
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
        modal: {
          escape: true,
          ondismiss: function () {
            console.log("User canceled the transaction");
            setIsSubmitting(false); // Reset the button state when user cancels the transaction
          },
        },
      };

      const rzp1 = new window.Razorpay(options);

      rzp1.on("payment.failed", function (response) {
        console.log("Payment Failed", response);
        alert("Payment was not completed. Please try again.");
        setIsSubmitting(false); // Reset the button state if payment fails
      });

      rzp1.open();
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const currentDate = new Date();
  const cutoffDate  = new Date('2025‑09‑19T00:01:00');  // 9th August 1 AMto 
  const showRegular = true;//currentDate >= cutoffDate;  // Adjusted to "Regular" pricing

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
      pricingCategory: "Regular", 
      instituteOption: "", // Reset institute option
    });
    setAmount(0);
    setIsSubmitting(false);
  };

  // Show institute options only when pre-conference or both is selected
  const showInstituteOptions = formData.participation === 'pre_conference' || formData.participation === 'both';

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row">
        <div className="h-full max-w-2xl p-6 mx-auto">
          <div className="">
            <h1 className="text-3xl font-bold text-purple-700">SAATA CONFERENCE 2025</h1>
            <img className="mt-4" src="http://images.ctfassets.net/acxjtojz8lp2/3jhd043UMe18aedFDSoRjy/c2991e0479d1f063e13b0bf5d9ed7690/WhatsApp_Image_2024-12-23_at_19.45.10.jpeg" alt="img" />
            <h2 className="text-xl font-semibold mt-2">Exploring the Kaleidoscope of Life</h2>

            <p className="mt-4 text-gray-700">
              Join us for an enriching experience at the SAATA Conference 2025, where professionals and individuals from diverse backgrounds come together to explore well-being and holistic living through the lens of Transactional Analysis and related fields.
            </p>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">Conference Details</h3>
              <p className="mt-2"><strong>Pre-conference Institutes:</strong> September 19, 2025</p>
              <p>Hotel Vestin Park, Chennai - <a href="https://www.vestinpark.com" className="text-blue-600 underline">Visit Website</a></p>

              <p className="mt-2"><strong>Conference:</strong> September 20-21, 2025</p>
              <p>Hotel Savera, Chennai - <a href="https://www.saverahotel.com/contact-us/" className="text-blue-600 underline">Visit Website</a></p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">THEME: KALEIDOSCOPE OF LIFE</h3>
              <p className="mt-2 text-gray-700">
                The kaleidoscope, where the dance of light and mirrors gives birth to enchanting, multicolored patterns, serves as a powerful symbol for the complexity of life, with its ever-changing interplay of emotions, relationships, environments, and diverse perspectives.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">📌 Refund Policy:</h3>
              <ul className="list-disc ml-6 mt-2 text-gray-700">
                <li>Before June 16, 2025 – 90% refund</li>
                <li>Before September 1, 2025 – 75% refund</li>
                <li>After September 1, 2025 – No refunds</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">📌 Ticket Transfer Terms & Conditions:</h3>
              <ul className="list-disc ml-6 mt-2 text-gray-700">
                <li>Transfers must be requested via email to <a href="mailto:conference@saata.org" className="text-blue-600 underline">conference@saata.org</a> at least 7 days before the event.</li>
                <li>The new participant must meet the eligibility criteria for the ticket category.</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">Join Us!</h3>
              <p className="mt-2 text-gray-700">
                The conference is an invitation to learn, express, and experience the richness of Transactional Analysis and related fields in action!
              </p>
              <p className="mt-2 text-gray-700">
                Don’t miss this opportunity to immerse yourself in the transformative power of Transactional Analysis. Whether you are a corporate leader, counselor, educator, therapist, or an individual seeking personal growth or supporting mental health of the society at large, SAATA Conference 2025 offers something valuable for everyone.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">🔗 Visit <a href="https://saata.org" className="text-blue-600 underline">saata.org</a> for updates.</h3>
              <h3 className="text-lg font-semibold mt-2">📧 For queries, write to <a href="mailto:conference@saata.org" className="text-blue-600 underline">conference@saata.org</a></h3>
            </div>
            <p className="mt-3 text-gray-700 font-semibold">
            Confirmation of registration will be emailed within a week .<br></br>
            Thank you.
              </p>
          </div>
         
        </div>
        <div className="relative max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
          <form className="sticky top-0 h-min">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Conference Registration</h2>
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                <input type="text" name="name" value={formData.name} placeholder="First Name/ Last Name" className="input-field" onChange={handleChange} required />
                <input type="email" name="email" value={formData.email} placeholder="Email" className="input-field" onChange={handleChange} pattern={valid} required />
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
                    <>
                      <option value="SAATA Member">SAATA Member</option>
                      <option value="Non-SAATA Member">Non-SAATA Member</option>
                      <option value="Student(Fulltime)">Student(Fulltime)</option>
                    </>
              
                </select>
              </div>
              <div className="mt-4">
                <p className="font-semibold">Pricing Category:</p>
                <select name="pricingCategory" value={formData.pricingCategory} onChange={handleChange} className="input-field">
                  {showRegular ? (
                     <option value="Regular">Regular</option>
                  ) : (
                    <>
                      <option value="Super Early Bird">Super Early Bird</option>
                      <option value="Early Bird">Early Bird </option>
                      <option value="Regular">Regular</option>
                    </>
                  )}
                </select>
                </div>
                <div className="mt-4">
                  <p className="font-semibold">Dates of Participation:</p>
                  <select name="participation" value={formData.participation} onChange={handleChange} className="input-field">
                    <option value="">Select</option>
                    <option value="pre_conference">Pre-Conference Institute (19 Sep)</option>
                    <option value="conference">Conference (20 & 21 Sep)</option>
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
                  >
                    <option value="">Select an Institute</option>
                    {institutes.map((institute, index) => (
                      <option key={index} value={institute}>
                        {institute}
                      </option>
                    ))}
                  </select>
                </div>
              )}
                {error && <div className="error w-full text-red-600 mt-4 text-center">{error}</div>}
              <button
                onClick={handlePayment}
                className={`w-full py-3 text-white font-bold rounded-lg mt-4 transition ${isSubmitting || amount === 0 ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                disabled={isSubmitting || amount === 0}
              >
                {isSubmitting ? "Processing..." : "Pay Now"}
              </button>
              {paymentSuccess && (
                <p className="text-[#9cca3b] font-semibold mt-2 text-center">
                  Payment successful! Thank you for registering.
                </p>
              )}            
              </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RazorpayButton;

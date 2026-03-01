import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const notifySuccess = () => {
    toast.success(
      "Thank you for contacting saata. We will respond to your message within 3 working days.😊",
      {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      },
    );
  };

  const notifyError = () => {
    toast.error("❌ Failed to send message. Please try again.", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Trim values to avoid empty spaces issue
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedSubject ||
      !type ||
      !trimmedMessage
    ) {
      setError("⚠️ Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    const templateParams = {
      from_name: trimmedName,
      from_email: trimmedEmail,
      subject: trimmedSubject,
      type: type,
      message: trimmedMessage,
    };

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICEID,
        process.env.REACT_APP_EMAILJS_TEMPLATEID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLICKEY,
      )
      .then(() => {
        notifySuccess();
        setLoading(false);

        // Reset fields
        setName("");
        setEmail("");
        setSubject("");
        setType("");
        setMessage("");
        setError("");
      })
      .catch((err) => {
        console.error("Email Error:", err);
        setLoading(false);
        setError("❌ Something went wrong. Please try again.");
        notifyError();
      });
  };

  return (
    <section className="contact" id="contact">
      <div className="contact_wrapper">
        <form className="contact_form" onSubmit={handleSubmit}>
          <h2>Contact Us</h2>
          <div className="address-container">
            <div className="address-title">
              <p></p>
            </div>
            <div className="address-line">
              <p>
                L-505, Purva Belmont,Trichy Road, Singanallur,Coimbatore -
                641005,Tamil Nadu, India <br />{" "}
              </p>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}

          <div className="input_wrapper">
            <div className="input_field">
              <input
                type="text"
                className="inner-input"
                placeholder="Your Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
              {!isNameFocused && (
                <span className="input-icons">
                  <FaUserAlt />
                </span>
              )}
            </div>

            <div className="input_field">
              <input
                type="email"
                className="inner-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
              {!isEmailFocused && (
                <span className="input-icons">
                  <MdEmail />
                </span>
              )}
            </div>

            <div className="input_field">
              <select
                className="inner-input"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setError("");
                }}
              >
                <option value="">Select Type *</option>
                <option value="General Enquiry">General Enquiry</option>
                <option value="Certification & Examination Support">
                  Certification & Examination Support
                </option>
                <option value="Membership Enquiry">Membership Enquiry</option>
                <option value="Training & Workshop Information">
                  Training & Workshop Information
                </option>
                <option value="Website / Technical Support">
                  Website / Technical Support
                </option>
                <option value="Payment & Invoice Queries">
                  Payment & Invoice Queries
                </option>
                <option value="Events & Conference Enquiries">
                  Events & Conference Enquiries
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input_field">
              <input
                type="text"
                className="inner-input"
                placeholder="Subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError("");
                }}
              />
            </div>
          </div>

          <textarea
            rows="6"
            className="inner-Massege"
            placeholder="Your Message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
          ></textarea>

          <input
            type="submit"
            className="submit-btn"
            value={loading ? "Sending..." : "Send"}
            disabled={loading}
          />

          <ToastContainer />
        </form>
      </div>
    </section>
  );
};

export default Contact;

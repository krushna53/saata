import React, { useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserAlt } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { MdEmail } from "react-icons/md";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");
  const notify = () => {
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
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      setError("Please fill in all fields.");
      return;
    }

    const templateParams = {
      from_name: name,
      from_email: email,
      message: message,
    };

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICEID,
        process.env.REACT_APP_EMAILJS_TEMPLATEID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLICKEY
      )
      .then(
        (response) => {
          notify();
          setIsSent(true);
          setName("");
          setEmail("");
          setMessage("");
          setError("");
          console.log("Email sent:", response);
        },
        (error) => {
          console.error("Failed to send the email:", error);
          setError("Oops! Something went wrong. Please try again later.");
        }
      );
  };
  return (
    <>

      <section className="contact" id="contact">
        <div className="contact_wrapper">
        {/* <div className="map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.5183433954835!2d77.0082269142886!3d10.99968215804207!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8576277c3f175%3A0x149ab1a4e986e87b!2sKrishna%20Colony%20Main%20Rd%2C%20Krishna%20Colony%2C%20Coimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1677652885046!5m2!1sen!2sin"
              width="800"
              height="545"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="map"
            ></iframe>
            
          </div> */}
          <form className="contact_form" onSubmit={handleSubmit}>
          
            <h2>Contact Us</h2>
            <div className="address-container">
    <div className="address-title">
      <p></p>
      </div>
    <div className="address-line">
     <p>L-505, Purva Belmont,Trichy Road, Singanallur,Coimbatore - 641005,Tamil Nadu, India <br /> </p> 
    </div>
  </div>
            <p>
              Thank you for writing to us. You will receive a reply within 3
              working days.
            </p>
            <div className="input_wrapper">
              <div className="input_field">
                <input
                  type="text"
                  className="inner-input"
                  placeholder="Your Name"
                  name="user_name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
                {!isNameFocused && (
                  <a href="/" className="input-icons">
                    <FaUserAlt />
                  </a>
                )}
              </div>
              <div className="input_field">
                <input
                  type="email"
                  className="inner-input"
                  placeholder="Email Address"
                  name="user_email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
                {!isEmailFocused && (
                  <a href="/" className="input-icons">
                    <MdEmail />
                  </a>
                )}
              </div>
            </div>
            <textarea
              rows="10"
              cols="30"
              className="inner-Massege"
              placeholder="Your Message..."
              name="message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <input type="submit" className="submit-btn" value="Send" />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </form>
        
        </div>
      </section>
    </>
  );
};

export default Contact;

const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args)); // Fix for node-fetch
require("dotenv").config();

const router = express.Router();

router.post("/verify-recaptcha", async (req, res) => { // Do NOT include "/api" here
  const { token } = req.body;
  const secretKey = process.env.REACT_APP_RECAPTCHA_SECRET_KEY;

  if (!token) {
    return res.status(400).json({ success: false, message: "Missing reCAPTCHA token." });
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });

    const data = await response.json();
    res.json(data); // Return JSON response
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

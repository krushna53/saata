require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.handler = async (event) => {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // ✅ CORS pre-flight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // ✅ Allow only POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const { amount, advertiserId = null, plan = null } = JSON.parse(event.body);

    if (!amount || isNaN(amount)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: "Valid amount is required" }),
      };
    }

    // ✅ Razorpay order options
    const options = {
      amount: amount * 100, // Razorpay needs paise
      currency: "INR",
      receipt: advertiserId ? `adv_${advertiserId}_${Date.now()}` : `receipt_${Date.now()}`,
      notes: advertiserId ? { advertiserId, plan } : {},
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Order Created:", order);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error("❌ Order Creation Failed:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: "Failed to create order" }),
    };
  }
};

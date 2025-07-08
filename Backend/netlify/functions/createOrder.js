

require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.handler = async (event) => {
  /* ── CORS pre‑flight ───────────────────────────────── */
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  /* ── Allow only POST ───────────────────────────────── */
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Method Not Allowed",
    };
  }

  try {
    /*  Existing flow sends { amount }
        Advertiser flow sends { amount, advertiserId, plan }            */
    const { amount, advertiserId = null, plan = null } = JSON.parse(event.body);

    if (!amount) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "Amount is required" }),
      };
    }

    /* ── ORIGINAL LOGIC (unchanged) ───────────────────── */
    const options = {
      amount:   amount * 100,             // paise
      currency: "INR",
      receipt:  `receipt_${Date.now()}`,  // default receipt
    };

    /* ── 🔸 NEW: tweak for Advertiser flow ────────────── */
    if (advertiserId) {
      options.receipt = `adv_${advertiserId}_${Date.now()}`; // unique prefix
      options.notes   = { advertiserId, plan };              // keeps meta intact
    }

    /* ── Create order ─────────────────────────────────── */
    const order = await razorpay.orders.create(options);
    console.log("✅ Order Created:", order);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error("❌ Order Creation Failed:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: "Failed to create order" }),
    };
  }
};

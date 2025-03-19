const express = require("express");
const serverless = require("serverless-http");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const db = require("../firebaseAdmin");
const { format } = require("fast-csv");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const verifyRecaptchaRoute = require("./api/verify-recaptcha"); // Ensure correct path
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", verifyRecaptchaRoute); // <-- Ensure this is set

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Order Created:", order);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Order Creation Failed:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

// ✅ Handle Payment Webhook
app.post("/webhooks", async (req, res) => {
  try {
    console.log("🔍 Webhook received:", JSON.stringify(req.body, null, 2));

    const paymentData = req.body;
    if (!paymentData.id) {
      return res.status(400).json({ success: false, message: "Invalid webhook data" });
    }

    let createdAt = paymentData.created_at
      ? new Date(paymentData.created_at * 1000)
      : new Date();

    if (isNaN(createdAt.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid timestamp" });
    }

    const docRef = db.collection("payments").doc(paymentData.id);
    await docRef.set({
      id: paymentData.id,
      order_id: paymentData.order_id || "",
      amount: paymentData.amount || 0,
      currency: paymentData.currency || "",
      status: paymentData.status || "",
      email: paymentData.email || "",
      contact: paymentData.contact || "",
      method: paymentData.method || "",
      notes: paymentData.notes || [],
      created_at: createdAt.toISOString(),
    });

    console.log("✅ Payment saved to Firestore with ID:", paymentData.id);

    const filePath = "payments.csv";
    const writeHeader = !fs.existsSync(filePath);

    const headers = [
      "id",
      "order_id",
      "amount",
      "currency",
      "status",
      "email",
      "contact",
      "method",
      "notes",
      "created_at",
    ];

    const ws = fs.createWriteStream(filePath, { flags: "a" });
    const csvStream = format({ headers: writeHeader, includeEndRowDelimiter: true });

    csvStream.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));

    csvStream.write([
      paymentData.id,
      paymentData.order_id || "",
      paymentData.amount || 0,
      paymentData.currency || "",
      paymentData.status || "",
      paymentData.email || "",
      paymentData.contact || "",
      paymentData.method || "",
      JSON.stringify(paymentData.notes || []),
      createdAt.toISOString(),
    ]);
    csvStream.end();

    res.status(200).json({ success: true, message: "Payment saved successfully" });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Export Netlify Function
module.exports.handler = serverless(app);

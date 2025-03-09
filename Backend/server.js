const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
// const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5000;
const db = require("./firebaseAdmin");
const { format } = require("fast-csv");
require("dotenv").config();


// 🔹 Replace with your Razorpay credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Create Razorpay Order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount)
      return res
        .status(400)
        .json({ success: false, message: "Amount is required" });

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
      console.error("❌ Invalid Webhook Data:", req.body);
      return res
        .status(400)
        .json({ success: false, message: "Invalid webhook data" });
    }

    console.log("✅ Extracted Payment Data:", paymentData);

    // ✅ Save data to Firestore (Database)
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
      created_at: new Date(paymentData.created_at * 1000).toISOString(),
    });
    console.log("✅ Payment saved to Firestore with ID:", paymentData.id);

    // ✅ Append data to CSV in table format
    const filePath = "payments.csv";
    const writeHeader = !fs.existsSync(filePath); // Add headers if file doesn't exist

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

    const ws = fs.createWriteStream(filePath, { flags: "a" }); // Append mode
    const csvStream = format({ headers: writeHeader, includeEndRowDelimiter: true });

    csvStream.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));

    const csvData = [
      paymentData.id,
      paymentData.order_id || "",
      paymentData.amount || 0,
      paymentData.currency || "",
      paymentData.status || "",
      paymentData.email || "",
      paymentData.contact || "",
      paymentData.method || "",
      JSON.stringify(paymentData.notes || []), // Convert notes to string
      new Date(paymentData.created_at * 1000).toISOString(), // Convert timestamp
    ];

    csvStream.write(csvData);
    csvStream.end(); // Close stream properly

    console.log("✅ Payment appended to CSV:", filePath);

    res.status(200).json({ success: true, message: "Payment saved successfully" });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

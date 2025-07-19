const express    = require("express");
const serverless = require("serverless-http");
const fs         = require("fs");
const cors       = require("cors");
const bodyParser = require("body-parser");
const Razorpay   = require("razorpay");
const db         = require("./firebaseAdmin");
const { format } = require("fast-csv");
const path       = require("path");
require("dotenv").config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Test route
router.get("/", (_req, res) => res.send("✅ Netlify API is live!"));

// 🔹 Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, advertiserId = null, plan = null } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: "Amount is required" });

    const options = {
      amount,
      currency: "INR",
      receipt: advertiserId ? `adv_${advertiserId}_${Date.now()}` : `receipt_${Date.now()}`,
      notes: { advertiserId, plan },
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Order Created:", order);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Order Creation Failed:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

// 🔹 Store payment info
router.post("/storePayment", async (req, res) => {
  const payment = req.body;
  try {
    await db.collection("sponsor-payment").doc(payment.id).set(payment);
    console.log("✅ Stored payment via /storePayment:", payment.id);

    const advPath = "advertiser_payments.csv";
    const writeHeader = !fs.existsSync(advPath);
    const ws = fs.createWriteStream(advPath, { flags: "a" });
    const csv = format({ headers: writeHeader, includeEndRowDelimiter: true });
    csv.pipe(ws).on("finish", () => console.log("✅ Advertiser CSV Write"));

    csv.write({
      id: payment.id,
      order_id: payment.order_id || "",
      amount: payment.amount || "",
      currency: payment.currency || "",
      status: payment.status || "",
      email: payment.advertiser?.email || "",
      contact: payment.advertiser?.phone || "",
      method: payment.method || "",
      advertiserId: payment.notes?.advertiserId || "",
      plan: payment.notes?.plan || "",
      created_at: payment.created_at || new Date().toISOString(),
    });
    csv.end();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to store payment:", err);
    res.status(500).json({ success: false });
  }
});
// ✅ Route to get ad bookings count
app.get("/adBookings", async (req, res) => {
  try {
    const snapshot = await db.collection("sponsor-payment").get();
    const counts = {};
    snapshot.forEach(doc => {
      const plan = doc.data()?.notes?.plan;
      if (plan) {
        counts[plan] = (counts[plan] || 0) + 1;
      }
    });

    console.log("Plan A Count:", counts.PlanA || 0);
    console.log("Plan B Count:", counts.PlanB || 0);

    res.status(200).json(counts);
  } catch (err) {
    console.error("Error fetching ad bookings:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// 🔹 Razorpay webhook
router.post("/webhooks", async (req, res) => {
  try {
    const p = req.body;
    if (!p.id) return res.status(400).json({ success: false, message: "Invalid webhook data" });

    const createdAt = p.created_at ? new Date(p.created_at * 1000) : new Date();
    await db.collection("payments").doc(p.id).set({
      id: p.id,
      order_id: p.order_id || "",
      amount: p.amount || "",
      currency: p.currency || "",
      status: p.status || "",
      email: p.email || "",
      contact: p.contact || "",
      method: p.method || "",
      notes: p.notes || {},
      created_at: createdAt.toISOString(),
    });

    const filePath = "payments.csv";
    const writeHeader = !fs.existsSync(filePath);
    const ws = fs.createWriteStream(filePath, { flags: "a" });
    const csv = format({ headers: writeHeader, includeEndRowDelimiter: true });
    csv.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));

    csv.write([
      p.id,
      p.order_id || "",
      p.amount || "",
      p.currency || "",
      p.status || "",
      p.email || "",
      p.contact || "",
      p.method || "",
      JSON.stringify(p.notes || {}),
      createdAt.toISOString(),
    ]);
    csv.end();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ success: false });
  }
});

// 🔹 Static image access
app.use("/Images", express.static(path.join(__dirname, "../public/Images")));

// 🔹 Bind router for Netlify Functions
app.use("/.netlify/functions/api", router);

// 🔹 For local dev server
const PORT = process.env.PORT || 5041;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
// 🔹 Export for Netlify
module.exports.handler = serverless(app);

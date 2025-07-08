
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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (_req, res) => res.send("✅ Backend server is running!"));
app.use("/Images", express.static(path.join(__dirname, "../public/Images")));

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  try {
    const { amount, advertiserId = null, plan = null } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const options = {
      amount,                    // passed as‑is ( already in paise )
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    /* 🔸 NEW: tag advertiser orders */
    if (advertiserId) {
      options.receipt = `adv_${advertiserId}_${Date.now()}`;
      options.notes   = { advertiserId, plan };
    }

    const order = await razorpay.orders.create(options);
    console.log("✅ Order Created:", order);
    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Order Creation Failed:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
});


app.post("/webhooks", async (req, res) => {
  try {
    console.log("🔍 Webhook received:", JSON.stringify(req.body, null, 2));

    const paymentData = req.body;
    if (!paymentData.id) {
      return res.status(400).json({ success: false, message: "Invalid webhook data" });
    }

    const createdAt = paymentData.created_at
      ? new Date(paymentData.created_at * 1000)
      : new Date();
    if (isNaN(createdAt.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid timestamp" });
    }

    /* ────── ORIGINAL WRITE ────── */
    await db.collection("payments").doc(paymentData.id).set({
      id:        paymentData.id,
      order_id:  paymentData.order_id || "",
      amount:    paymentData.amount    || "",
      currency:  paymentData.currency  || "",
      status:    paymentData.status    || "",
      email:     paymentData.email     || "",
      contact:   paymentData.contact   || "",
      method:    paymentData.method    || "",
      notes:     paymentData.notes     || [],
      created_at: createdAt.toISOString(),
    });
    console.log("✅ Payment saved to Firestore (payments) with ID:", paymentData.id);

    const filePath = "payments.csv";
    const writeHeader = !fs.existsSync(filePath);
    const baseHeaders = [
      "id","order_id","amount","currency","status",
      "email","contact","method","notes","created_at",
    ];
    const ws  = fs.createWriteStream(filePath, { flags: "a" });
    const csv = format({ headers: writeHeader, includeEndRowDelimiter: true });
    csv.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));
    csv.write([
      paymentData.id,
      paymentData.order_id || "",
      paymentData.amount   || "",
      paymentData.currency || "",
      paymentData.status   || "",
      paymentData.email    || "",
      paymentData.contact  || "",
      paymentData.method   || "",
      JSON.stringify(paymentData.notes || []),
      createdAt.toISOString(),
    ]);
    csv.end();

    //  NEW: Advertiser‑specific write
    // if (paymentData.notes?.advertiserId) {
      await db.collection("sponsor-payment").doc(paymentData.id).set(paymentData);
     console.log(
  "📦 Saved to Firestore (advertiserPayments):",
  JSON.stringify(paymentData, null, 2)
);


      // 2️⃣ CSV
      const advPath       = "advertiser_payments.csv";
      const advWriteHead  = !fs.existsSync(advPath);
      const advHeaders    = [
        "id","order_id","amount","currency","status","email","contact","method",
        "advertiserId","plan","created_at",
      ];
      const advWs  = fs.createWriteStream(advPath, { flags: "a" });
      const advCsv = format({ headers: advWriteHead, includeEndRowDelimiter: true });
      advCsv.pipe(advWs).on("finish", () => console.log("✅ Advertiser CSV Write"));
      advCsv.write({
        id:           paymentData.id,
        order_id:     paymentData.order_id || "",
        amount:       paymentData.amount   || "",
        currency:     paymentData.currency || "",
        status:       paymentData.status   || "",
        email:        paymentData.email    || "",
        contact:      paymentData.contact  || "",
        method:       paymentData.method   || "",
        advertiserId: paymentData.notes.advertiserId,
        plan:         paymentData.notes.plan ?? "",
        created_at:   createdAt.toISOString(),
      });
      advCsv.end();
    // }

    res.status(200).json({ success: true, message: "" });
  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/* ──────────────────────────────────────────────────────────────
   Export Netlify Function & local dev server
─────────────────────────────────────────────────────────────── */
module.exports.handler = serverless(app);
app.post("/storePayment", (req, res) => {
  console.log("✅ Payment received:", req.body);
  res.json({ success: true, message: "Payment stored successfully", payment: req.body });
});

const PORT = Number(process.env.PORT) || 5041;
app.listen(PORT, () =>
  console.log(`🚀  Server listening on http://localhost:${PORT}`)
);

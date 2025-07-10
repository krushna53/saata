const fs = require("fs");
const { format } = require("fast-csv");
const db = require("../../firebaseAdmin");

exports.handler = async (event) => {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const payment = JSON.parse(event.body);

    if (!payment.id) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: "Missing payment ID" }),
      };
    }

    // ✅ Save to Firestore
   const isSponsor = payment.notes?.advertiserId === "adv_001";
   const collectionName = isSponsor ? "sponsor-payment" : "payments";

   // ✅ Save to the correct Firestore collection
     await db.collection(collectionName).doc(payment.id).set(payment);


    if (isSponsor) {
  // ✅ Write only advertiser_payments.csv
  const advPath = "/tmp/advertiser_payments.csv";
  const advHeaders = [
    "id", "order_id", "amount", "currency", "status",
    "email", "contact", "method",
    "advertiserId", "plan",
    "created_at",
  ];
  const advWriteHeader = !fs.existsSync(advPath);
  const advWs = fs.createWriteStream(advPath, { flags: "a" });
  const advCsv = format({ headers: advWriteHeader, includeEndRowDelimiter: true });

  advCsv.pipe(advWs).on("finish", () => console.log("✅ Advertiser CSV write done"));
  advCsv.write({
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
  advCsv.end();
} else {
  // ✅ Write only payments.csv
  const mainPath = "/tmp/payments.csv";
  const mainHeaders = [
    "id", "order_id", "amount", "currency", "status",
    "email", "contact", "method", "notes", "created_at",
  ];
  const mainWriteHeader = !fs.existsSync(mainPath);
  const mainWs = fs.createWriteStream(mainPath, { flags: "a" });
  const mainCsv = format({ headers: mainWriteHeader, includeEndRowDelimiter: true });

  mainCsv.pipe(mainWs).on("finish", () => console.log("✅ Main CSV write done"));
  mainCsv.write({
    id: payment.id,
    order_id: payment.order_id || "",
    amount: payment.amount || "",
    currency: payment.currency || "",
    status: payment.status || "",
    email: payment.advertiser?.email || "",
    contact: payment.advertiser?.phone || "",
    method: payment.method || "",
    notes: JSON.stringify(payment.notes || {}),
    created_at: payment.created_at || new Date().toISOString(),
  });
  mainCsv.end();
}

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, message: "Payment stored successfully" }),
    };
  } catch (error) {
    console.error("❌ Payment Save Failed:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: "Internal Server Error" }),
    };
  }
};

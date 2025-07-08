const fs = require("fs");
const { format } = require("fast-csv");
const db = require("../../firebaseAdmin");

exports.handler = async (event) => {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // ✅ Handle pre‑flight (CORS OPTIONS request)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  // ✅ Ensure only POST requests are processed
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const paymentData = JSON.parse(event.body);

    if (!paymentData.id) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: "Invalid data" }),
      };
    }

    // ✅ Save to Firebase Firestore (normal collection)
    await db.collection("payments").doc(paymentData.id).set(paymentData);

    // ✅ Append data to CSV  →  /tmp/payments.csv
    const filePath = "/tmp/payments.csv";
    const headers  = [
      "id", "order_id", "amount", "currency", "status",
      "email", "contact", "method", "notes", "created_at",
    ];

    const writeHeader = !fs.existsSync(filePath);
    const ws         = fs.createWriteStream(filePath, { flags: "a" });
    const csvStream  = format({ headers: writeHeader, includeEndRowDelimiter: true });

    csvStream.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));
    csvStream.write(Object.values(paymentData));
    csvStream.end();

    
      //  NEW: ALSO store Advertiser payments separately
   
   await db.collection("sponsor-payment").doc(paymentData.id).set(paymentData);

    const advPath   = "/tmp/advertiser_payments.csv";
      const advHeader = [
        "id", "order_id", "amount", "currency", "status",
        "email", "contact", "method",
        "advertiserId", "plan",               // extra columns
        "created_at",
      ];

      const advWriteHeader = !fs.existsSync(advPath);
      const advWs  = fs.createWriteStream(advPath, { flags: "a" });
      const advCsv = format({ headers: advWriteHeader, includeEndRowDelimiter: true });

      advCsv.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));
    advCsv.write(Object.values(paymentData));
    advCsv.end();



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
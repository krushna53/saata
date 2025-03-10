const fs = require("fs");
const { format } = require("fast-csv");
const db = require("../../firebaseAdmin");

exports.handler = async (event) => {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // ✅ Handle preflight (CORS OPTIONS request)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
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

    // ✅ Save to Firebase Firestore
    const docRef = db.collection("payments").doc(paymentData.id);
    await docRef.set(paymentData);

    // ✅ Append data to CSV (Netlify can only write to `/tmp/`)
    const filePath = "/tmp/payments.csv"; 
    const headers = ["id", "order_id", "amount", "currency", "status", "email", "contact", "method", "notes", "created_at"];
    
    let writeHeader = false;
    if (!fs.existsSync(filePath)) {
      writeHeader = true;
    }

    const ws = fs.createWriteStream(filePath, { flags: "a" });
    const csvStream = format({ headers: writeHeader, includeEndRowDelimiter: true });

    csvStream.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));
    csvStream.write(Object.values(paymentData));
    csvStream.end();

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

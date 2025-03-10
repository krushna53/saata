const fs = require("fs");
const { format } = require("fast-csv");
const db = require("../../firebaseAdmin");

exports.handler = async (event) => {
  try {
    // ✅ Handle CORS preflight requests
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Access-Control-Allow-Origin": "*" }, // ✅ CORS here
        body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
      };
    }

    const paymentData = JSON.parse(event.body);
    if (!paymentData.id) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" }, // ✅ CORS here
        body: JSON.stringify({ success: false, message: "Invalid data" }),
      };
    }

    // ✅ Save to Firebase Firestore
    const docRef = db.collection("payments").doc(paymentData.id);
    await docRef.set(paymentData);

    // ✅ Append data to CSV (Netlify file system issue workaround)
    const filePath = "/tmp/payments.csv"; // ✅ Netlify Functions can only write to /tmp
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
      headers: { "Access-Control-Allow-Origin": "*" }, // ✅ Always include CORS
      body: JSON.stringify({ success: true, message: "Payment stored successfully" }),
    };
  } catch (error) {
    console.error("❌ Payment Save Failed:", error);

    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" }, // ✅ CORS for errors too
      body: JSON.stringify({ success: false, message: "Internal Server Error" }),
    };
  }
};

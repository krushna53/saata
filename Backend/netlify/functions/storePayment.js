const fs = require("fs");
const { format } = require("fast-csv");
const db = require("../../firebaseAdmin");

exports.handler = async (event) => {
  try {
    const paymentData = JSON.parse(event.body);
    
    if (!paymentData.id) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "Invalid data" }) };
    }

    // Save to Firebase Firestore
    const docRef = db.collection("payments").doc(paymentData.id);
    await docRef.set(paymentData);

    // Append data to CSV
    const filePath = "/tmp/payments.csv";  // Use /tmp for Netlify functions
    const headers = ["id", "order_id", "amount", "currency", "status", "email", "contact", "method", "notes", "created_at"];
    const writeHeader = !fs.existsSync(filePath);

    const ws = fs.createWriteStream(filePath, { flags: "a" });
    const csvStream = format({ headers: writeHeader, includeEndRowDelimiter: true });

    csvStream.pipe(ws).on("finish", () => console.log("✅ CSV Write Complete"));
    csvStream.write(Object.values(paymentData));
    csvStream.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error("❌ Payment Save Failed:", error);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Internal Server Error" }) };
  }
};

const admin = require("../../firebaseAdmin");

exports.handler = async (event, context) => {
  try {
    const snapshot = await admin.collection("sponsor-payment").get();

    const counts = {};
    snapshot.forEach(doc => {
      const plan = doc.data()?.notes?.plan;
      if (plan) {
        counts[plan] = (counts[plan] || 0) + 1;
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(counts),
    };
  } catch (err) {
    console.error("❌ Error in ad-bookings:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch ad bookings" }),
    };
  }
};

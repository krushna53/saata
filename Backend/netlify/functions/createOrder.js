// Load .env only when running locally
if (!process.env.NETLIFY) {
  require('dotenv').config();
}

const Razorpay = require('razorpay');

const rzp = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const { amount, advertiserId = null, plan = null } = JSON.parse(event.body || '{}');
    const total = Number(amount);

    if (!Number.isFinite(total) || total <= 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Valid amount is required' }),
      };
    }

    const order = await rzp.orders.create({
      amount: Math.round(total * 100), // Convert ₹ to paise
      currency: 'INR',
      receipt: advertiserId ? `adv_${advertiserId}_${Date.now()}` : `receipt_${Date.now()}`,
      notes: advertiserId ? { advertiserId, plan } : undefined,
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error('❌ Order Creation Failed:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Failed to create order' }),
    };
  }
};

const fetch = require("node-fetch");

const CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
const API_URL = "https://www.zohoapis.in/subscriptions/v1/subscriptions";

// 🔹 Get a new access token using refresh token
async function getAccessToken() {
  const params = new URLSearchParams({
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${TOKEN_URL}?${params}`, { method: "POST" });
  const data = await res.json();

  if (data.access_token) {
    return data.access_token;
  } else {
    console.error("Failed to refresh token:", data);
    throw new Error("Token refresh failed");
  }
}

// 🔹 Main function
exports.handler = async () => {
  try {
    const accessToken = await getAccessToken();
    let page = 1;
    const activeMembers = [];

    while (true) {
      const res = await fetch(`${API_URL}?page=${page}`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      });

      const data = await res.json();

      console.log(`Page ${page} - Subscriptions found: ${data.subscriptions?.length || 0}`);
      if (page === 1) console.dir(data, { depth: null });

      if (!data.subscriptions || data.subscriptions.length === 0) {
        break;
      }

      const liveSubs = data.subscriptions.filter(
        (sub) => sub.status?.toLowerCase() === "live"
      );

      const members = liveSubs.map((sub) => ({
        name: sub?.customer_name || "Unknown",
        email: sub?.email || "N/A",
        membership: sub?.plan_name || "N/A",
        validity: sub?.current_term_ends_at || "",
      }));

      activeMembers.push(...members);
      page += 1;
    }

    // console.log(`✅ Total active members: ${activeMembers.length}`);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ members: activeMembers }),
    };
  } catch (err) {
    console.error("Failed to fetch members:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch members" }),
    };
  }
};

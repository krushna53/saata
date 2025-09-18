const fetch = require("node-fetch");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function getAccessToken() {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;

  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const res = await fetch(`https://accounts.zoho.in/oauth/v2/token?${params}`, {
    method: "POST",
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Failed to refresh token: ${data.error || "Unknown error"}`);
  }

  return data.access_token;
}

exports.handler = async () => {
  try {
    const accessToken = await getAccessToken();

    let page = 1;
    let allMembers = [];

    while (true) {
      const subsRes = await fetch(
        `https://www.zohoapis.in/subscriptions/v1/subscriptions?page=${page}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      const subsData = await subsRes.json();
      if (!subsRes.ok || !subsData.subscriptions) break;

      const liveSubs = subsData.subscriptions.filter(
        (sub) => sub.status?.toLowerCase() === "live"
      );

      const membersWithCity = liveSubs.map((sub) => {
        const city =
          sub?.billing_address?.city ||
          sub?.shipping_address?.city ||
          "N/A";

        return {
          name: sub?.customer_name || "Unknown",
          email: sub?.email || "N/A",
          membership: sub?.plan_name || "N/A",
          validity: sub?.current_term_ends_at || "",
          city,
        };
      });

      allMembers.push(...membersWithCity);
      page++;
      if (page > 10) break;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, members: allMembers }),
    };
  } catch (err) {
    console.error("💥 getMembers failed:", err);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

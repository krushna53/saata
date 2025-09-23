const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_FILE_PATH = path.join(__dirname, "membersCache.json");
const FAILED_LOG_PATH = path.join(__dirname, "failedSubscriptions.log");

// Load cache JSON into memory
function loadCache() {
  if (!fs.existsSync(CACHE_FILE_PATH)) return {};
  try {
    const rawData = fs.readFileSync(CACHE_FILE_PATH, "utf8");
    return JSON.parse(rawData);
  } catch (err) {
    console.error("Error reading cache file:", err);
    return {};
  }
}

// Save cache back to file
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
}

async function getAccessToken() {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  });

  const res = await fetch(`https://accounts.zoho.in/oauth/v2/token?${params}`, { method: "POST" });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`Failed to refresh token: ${data.error || "Unknown error"}`);
  return data.access_token;
}

async function getAllSubscriptions(accessToken) {
  let page = 1, allSubscriptions = [];
  while (true) {
    const res = await fetch(`https://www.zohoapis.in/billing/v1/subscriptions?page=${page}`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.subscriptions || data.subscriptions.length === 0) break;
    allSubscriptions.push(...data.subscriptions.filter(sub => sub.status?.toLowerCase() === "live"));
    page++;
    if (page > 50) break;
  }
  return allSubscriptions;
}

async function getFullSubscription(subscriptionId, accessToken) {
  const res = await fetch(`https://www.zohoapis.in/billing/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok || !data.subscription) throw new Error(`Failed to fetch subscription ${subscriptionId}`);
  return data.subscription;
}

// JSON cache functions
async function getCachedMember(subscriptionId) {
  const cache = loadCache();
  const entry = cache[subscriptionId];
  if (!entry) return null;

  const updatedAt = new Date(entry.updatedAt);
  if (Date.now() - updatedAt.getTime() > CACHE_DURATION) return null;

  return entry.memberData;
}

async function setCachedMember(subscriptionId, memberData) {
  const cache = loadCache();
  cache[subscriptionId] = {
    memberData,
    updatedAt: new Date().toISOString(),
  };
  saveCache(cache);
}

async function getCityForUser(subscription, accessToken) {
  const cacheKey = subscription.subscription_id;
  const cached = await getCachedMember(cacheKey);
  if (cached) return cached;

  try {
    const fullSub = await getFullSubscription(cacheKey, accessToken);
    const customer = fullSub.customer || {};
    const city = customer.billing_address?.city || customer.shipping_address?.city || "N/A";

    const memberData = {
      name: customer.display_name || subscription.customer_name || "Unknown",
      email: customer.email || subscription.email || "N/A",
      membership: fullSub.plan?.name || subscription.plan_name || "N/A",
      validity: fullSub.current_term_ends_at || "",
      city,
      subscriptionId: cacheKey,
    };

    await setCachedMember(cacheKey, memberData);
    return memberData;
  } catch (err) {
    console.warn(`Failed subscription ${cacheKey}:`, err.message);
    fs.appendFileSync(
      FAILED_LOG_PATH,
      `${new Date().toISOString()} - Failed subscription ${cacheKey}: ${err.message}\n`
    );
    return null;
  }
}

exports.handler = async () => {
  try {
    const accessToken = await getAccessToken();
    console.log("Fetching all subscriptions...");
    const allSubscriptions = await getAllSubscriptions(accessToken);
    console.log(`Found ${allSubscriptions.length} live subscriptions`);

    const allMembers = [];
    const batchSize = 20;

    for (let i = 0; i < allSubscriptions.length; i += batchSize) {
      const batch = allSubscriptions.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(sub => getCityForUser(sub, accessToken)));
      allMembers.push(...batchResults.filter(Boolean));
      await new Promise(res => setTimeout(res, 100));
    }

    console.log(`Processed ${allMembers.length} members`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, members: allMembers }),
    };
  } catch (err) {
    console.error("getMembers failed:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

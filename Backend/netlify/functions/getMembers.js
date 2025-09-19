const fetch = require("node-fetch");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

// In-memory cache for city data (consider using Redis/DynamoDB for production)
let cityCache = new Map();
let lastCacheUpdate = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

async function getAllSubscriptions(accessToken) {
  let page = 1;
  let allSubscriptions = [];
  
  while (true) {
    const subsRes = await fetch(
      `https://www.zohoapis.in/billing/v1/subscriptions?page=${page}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const subsData = await subsRes.json();
    if (!subsRes.ok || !subsData.subscriptions || subsData.subscriptions.length === 0) {
      break;
    }
    
    // Filter for live subscriptions only
    const liveSubs = subsData.subscriptions.filter(
      (sub) => sub.status?.toLowerCase() === "live"
    );
    
    allSubscriptions.push(...liveSubs);
    page++;
    
    // Safety break to prevent infinite loop
    if (page > 50) break;
  }
  
  return allSubscriptions;
}

async function getFullSubscription(subscriptionId, accessToken) {
  const res = await fetch(
    `https://www.zohoapis.in/billing/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  const data = await res.json();
  if (!res.ok || !data.subscription) {
    throw new Error(
      `Failed to fetch full subscription ${subscriptionId}: ${data.message || "Unknown error"}`
    );
  }
  return data.subscription;
}

function isCacheValid() {
  if (!lastCacheUpdate) return false;
  return Date.now() - lastCacheUpdate < CACHE_DURATION;
}

async function getCityForUser(subscription, accessToken) {
  const cacheKey = subscription.subscription_id;
  
  // Check if we have cached city data for this subscription
  if (cityCache.has(cacheKey) && isCacheValid()) {
    console.log(`Using cached city for subscription ${cacheKey}`);
    return cityCache.get(cacheKey);
  }
  
  try {
    console.log(`Fetching city for new/updated subscription ${cacheKey}`);
    const fullSub = await getFullSubscription(subscription.subscription_id, accessToken);
    const customer = fullSub.customer || {};
    const city = customer.billing_address?.city || 
                 customer.shipping_address?.city || 
                 "N/A";
    
    const memberData = {
      name: customer.display_name || subscription.customer_name || "Unknown",
      email: customer.email || subscription.email || "N/A", 
      membership: fullSub.plan?.name || subscription.plan_name || "N/A",
      validity: fullSub.current_term_ends_at || "",
      city,
      subscriptionId: subscription.subscription_id
    };
    
    // Cache the result
    cityCache.set(cacheKey, memberData);
    return memberData;
    
  } catch (err) {
    console.warn(`Failed to fetch details for subscription ${subscription.subscription_id}:`, err.message);
    return null;
  }
}

exports.handler = async () => {
  try {
    const accessToken = await getAccessToken();
    
    // Step 1: Get all subscriptions first
    console.log("Fetching all subscriptions...");
    const allSubscriptions = await getAllSubscriptions(accessToken);
    console.log(`Found ${allSubscriptions.length} live subscriptions`);
    
    // Step 2: Process subscriptions and get city data (with caching)
    const allMembers = [];
    const currentSubscriptionIds = new Set(allSubscriptions.map(sub => sub.subscription_id));
    
    // Remove cached entries for subscriptions that no longer exist
    for (const [cacheKey] of cityCache) {
      if (!currentSubscriptionIds.has(cacheKey)) {
        console.log(`Removing cached data for inactive subscription ${cacheKey}`);
        cityCache.delete(cacheKey);
      }
    }
    
    // Process subscriptions in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < allSubscriptions.length; i += batchSize) {
      const batch = allSubscriptions.slice(i, i + batchSize);
      
      const batchPromises = batch.map(subscription => 
        getCityForUser(subscription, accessToken)
      );
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(Boolean);
      allMembers.push(...validResults);
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < allSubscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Update cache timestamp
    lastCacheUpdate = Date.now();
    
    console.log(`Processed ${allMembers.length} members`);
    console.log(`Cache now contains ${cityCache.size} entries`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true, 
        members: allMembers,
        cacheInfo: {
          cachedEntries: cityCache.size,
          lastUpdate: new Date(lastCacheUpdate).toISOString()
        }
      }),
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
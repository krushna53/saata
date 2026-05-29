const fetch = require("node-fetch");
const crypto = require("crypto");

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

const INACTIVE_WINDOW_DAYS = 180;

// ── Zoho ─────────────────────────────────────────────────────────────────────

async function getZohoAccessToken() {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error("Missing ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN");
  }
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
  const res = await fetch(`https://accounts.zoho.in/oauth/v2/token?${params}`, { method: "POST" });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Zoho token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function fetchAllSubscriptions(accessToken) {
  const all = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://www.zohoapis.in/billing/v1/subscriptions?page=${page}&per_page=200`,
      { headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/json" } }
    );
    const data = await res.json();
    if (!res.ok || !data.subscriptions || data.subscriptions.length === 0) break;
    all.push(...data.subscriptions);
    if (!data.page_context?.has_more_page) break;
    page++;
    if (page > 50) break; // safety cap: 10,000 subscriptions
  }
  return all;
}

// ── Sync eligibility ──────────────────────────────────────────────────────────

function shouldSync(subscription) {
  const isLive = subscription.status?.toLowerCase() === "live";

  // Active (live) subscriptions always sync
  if (isLive) return true;

  // Inactive: only sync if subscription ended within 180 days
  const endDate = subscription.current_term_ends_at || subscription.end_of_term;
  if (!endDate) return false;
  const daysSince = (Date.now() - new Date(endDate).getTime()) / 86_400_000;
  return daysSince < INACTIVE_WINDOW_DAYS;
}

function parseName(fullName = "") {
  const parts = fullName.trim().split(" ");
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

// Mailchimp date fields must be MM/DD/YYYY
function toMailchimpDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// ── Mailchimp ─────────────────────────────────────────────────────────────────

function mailchimpAuth() {
  const key = process.env.MAILCHIMP_API_KEY;
  return "Basic " + Buffer.from(`user:${key}`).toString("base64");
}

function buildMember(sub) {
  const email = (sub.email || sub.customer_email || "").toLowerCase().trim();
  if (!email) return null;
  const { firstName, lastName } = parseName(sub.customer_name || "");
  const isLive = sub.status?.toLowerCase() === "live";
  return {
    email_address: email,
    status_if_new: "subscribed",
    tags: isLive ? ["live-subscriptions"] : ["expired"],
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName,
      PHONE: sub.phone || "",
      MMERGE5: String(sub.subscription_id || ""),
      MMERGE6: sub.subscription_number || sub.number || "",
      MMERGE7: sub.status || "",
      MMERGE8: String(sub.amount || sub.sub_total || ""),
      MMERGE9: toMailchimpDate(sub.next_billing_at || sub.current_term_ends_at),
      MMERGE10: sub.plan_name || sub.plan?.name || "",
    },
  };
}

// Batch upsert up to 500 members per call — much faster than individual PUTs
async function batchUpsertMailchimp(members) {
  const { MAILCHIMP_AUDIENCE_ID, MAILCHIMP_SERVER } = process.env;
  const res = await fetch(
    `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}`,
    {
      method: "POST",
      headers: { Authorization: mailchimpAuth(), "Content-Type": "application/json" },
      body: JSON.stringify({ members, update_existing: true }),
    }
  );
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || result.title || `HTTP ${res.status}`);
  return result; // { new_members, updated_members, errors[] }
}

// Batch upsert only adds tags — this removes the opposite stale tag per member
async function removeStaleTags(members) {
  const { MAILCHIMP_AUDIENCE_ID, MAILCHIMP_SERVER } = process.env;
  const BATCH_SIZE = 20;

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (member) => {
        const isLive = member.tags.includes("live-subscriptions");
        const tagToRemove = isLive ? "expired" : "live-subscriptions";
        const hash = crypto.createHash("md5").update(member.email_address).digest("hex");

        try {
          const res = await fetch(
            `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hash}/tags`,
            {
              method: "POST",
              headers: { Authorization: mailchimpAuth(), "Content-Type": "application/json" },
              body: JSON.stringify({ tags: [{ name: tagToRemove, status: "inactive" }] }),
            }
          );
          if (!res.ok && res.status !== 204) {
            const err = await res.json().catch(() => ({}));
            console.warn(`Tag removal failed for ${member.email_address}: ${err.detail || res.status}`);
          }
        } catch (err) {
          console.warn(`Tag removal error for ${member.email_address}:`, err.message);
        }
      })
    );
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const token = await getZohoAccessToken();
    console.log("Zoho access token obtained");

    const subscriptions = await fetchAllSubscriptions(token);
    console.log(`Fetched ${subscriptions.length} total subscriptions from Zoho`);

    // Build eligible member list — deduplicate by email (Mailchimp rejects batches with duplicates)
    const emailMap = new Map();
    let skipped = 0;

    for (const sub of subscriptions) {
      if (!shouldSync(sub)) { skipped++; continue; }
      const member = buildMember(sub);
      if (!member) { skipped++; continue; }
      // If same email appears twice in Zoho, last one wins (most recent in list)
      emailMap.set(member.email_address, member);
    }

    const members = Array.from(emailMap.values());
    console.log(`Eligible to sync: ${members.length}, skipped: ${skipped}`);

    // Batch upsert in chunks of 500 (Mailchimp limit per call)
    const BATCH_SIZE = 500;
    let synced = 0, failed = 0;
    const errors = [];

    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      try {
        const result = await batchUpsertMailchimp(batch);
        synced += (result.new_members?.length || 0) + (result.updated_members?.length || 0);
        if (result.errors?.length) {
          result.errors.forEach((e) => errors.push(e.email_address + ": " + e.error));
          failed += result.errors.length;
        }
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: new=${result.new_members?.length}, updated=${result.updated_members?.length}, errors=${result.errors?.length}`);
      } catch (err) {
        failed += batch.length;
        errors.push(err.message);
        console.error("Batch failed:", err.message);
      }
    }

    // Remove stale opposite tags (live-subscriptions from expired members, expired from live members)
    console.log("Removing stale tags...");
    await removeStaleTags(members);
    console.log("Tag cleanup complete");

    const summary = { total: subscriptions.length, eligible: members.length, synced, skipped, failed, errors: errors.slice(0, 20) };
    console.log("Sync complete:", JSON.stringify(summary));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, ...summary }),
    };
  } catch (err) {
    console.error("Sync error:", err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

// lib/apify.js
// Thin wrapper around Apify's "run actor synchronously, get dataset items"
// endpoint. No polling, no webhook receiver — the HTTP call just blocks
// until the run finishes and hands back the dataset.
//
// Requires env var: APIFY_TOKEN (set in Vercel project settings, not committed)

const APIFY_BASE = "https://api.apify.com/v2";

// If you swap actors later, this is the only place that needs to change.
const ACTORS = {
  tiktok: "clockworks~tiktok-profile-scraper",
  spotify: "fetch_cat~spotify-scraper",
};

async function runActorSync(actorSlug, input, { timeoutSecs = 120 } = {}) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set in environment variables");
  }

  const url = `${APIFY_BASE}/acts/${actorSlug}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Apify actor ${actorSlug} failed: ${res.status} ${res.statusText} — ${body}`
    );
  }

  return res.json(); // array of dataset items
}

/**
 * @param {string[]} usernames - TikTok usernames, no @ needed
 * @param {number} resultsPerPage - how many recent videos per profile
 */
async function fetchTikTokPosts(usernames, resultsPerPage = 30) {
  const input = {
    profiles: usernames,
    resultsPerPage,
    shouldDownloadCovers: false,
    shouldDownloadSlideshowImages: false,
    shouldDownloadVideos: false,
    shouldDownloadSubtitles: false,
  };

  return runActorSync(ACTORS.tiktok, input, { timeoutSecs: 180 });
}

/**
 * @param {string} artistUrl - full open.spotify.com/artist/... URL
 */
async function fetchSpotifyArtistStats(artistUrl) {
  const input = {
    startUrls: [{ url: artistUrl }],
    maxTotalChargeUsd: 0.05,
  };

  return runActorSync(ACTORS.spotify, input, { timeoutSecs: 90 });
}

module.exports = { fetchTikTokPosts, fetchSpotifyArtistStats };

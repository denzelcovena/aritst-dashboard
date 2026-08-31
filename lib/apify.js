// lib/apify.js
const APIFY_BASE = "https://api.apify.com/v2";

const ACTORS = {
  tiktok: "clockworks~tiktok-profile-scraper",
  spotify: "fetch_cat~spotify-scraper",
  instagram: "apify~instagram-followers-count-scraper",
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

  return res.json();
}

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

async function fetchSpotifyArtistStats(artistUrl) {
  const input = {
    startUrls: [{ url: artistUrl }],
    maxTotalChargeUsd: 0.05,
  };

  return runActorSync(ACTORS.spotify, input, { timeoutSecs: 90 });
}

/**
 * @param {string} username - Instagram username, no @ needed
 */
async function fetchInstagramStats(username) {
  const input = {
    usernames: [username],
  };

  return runActorSync(ACTORS.instagram, input, { timeoutSecs: 60 });
}

module.exports = { fetchTikTokPosts, fetchSpotifyArtistStats, fetchInstagramStats };

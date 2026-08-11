// api/cron/sync-social-data.js
// Hit nightly by Vercel Cron (see vercel.json). Pulls TikTok + Spotify data
// via Apify and upserts it into Supabase.

const { fetchTikTokPosts, fetchSpotifyArtistStats } = require("../../lib/apify");
const { upsertTikTokPosts, upsertSpotifyStats } = require("../../lib/supabaseUpserts");

// Your TikTok accounts — usernames only, no @ needed for this actor.
const TIKTOK_ACCOUNTS = [
  "tony.touchdown",
  "jeanettegrey1",
  "lonny.winter",
  "crynowlaughlater31",
  "lupereallycares",
  "denzel.mursic",
  "denzelcovena",
];

const SPOTIFY_ARTIST_URL = "https://open.spotify.com/artist/5rUTMTQfmomgiE54kBHG0U";

module.exports = async function handler(req, res) {
  // Vercel Cron sends a GET request with this header — reject anything else
  // so this endpoint can't be triggered by a random public GET.
  const authHeader = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = { tiktok: null, spotify: null, errors: [] };

  // Run both Apify calls in parallel — they're independent, and this roughly
  // halves total wall-clock time, which matters given the maxDuration cap below.
  const [tiktokOutcome, spotifyOutcome] = await Promise.allSettled([
    fetchTikTokPosts(TIKTOK_ACCOUNTS, 30).then(upsertTikTokPosts),
    fetchSpotifyArtistStats(SPOTIFY_ARTIST_URL).then(upsertSpotifyStats),
  ]);

  if (tiktokOutcome.status === "fulfilled") {
    results.tiktok = tiktokOutcome.value;
  } else {
    console.error("TikTok sync failed:", tiktokOutcome.reason);
    results.errors.push({ source: "tiktok", message: tiktokOutcome.reason.message });
  }

  if (spotifyOutcome.status === "fulfilled") {
    results.spotify = spotifyOutcome.value;
  } else {
    console.error("Spotify sync failed:", spotifyOutcome.reason);
    results.errors.push({ source: "spotify", message: spotifyOutcome.reason.message });
  }

  const status = results.errors.length > 0 ? 207 : 200; // 207 = partial success
  return res.status(status).json(results);
};

// Vercel Hobby plan caps functions at 60s; Pro allows up to 300s. The two
// Apify calls now run in parallel, but scraping 8 TikTok profiles x 30 videos
// can still take a couple minutes on a cold run. If you see 504s on Hobby,
// this is the first thing to bump — you'd need Pro for anything past 60s.
module.exports.config = {
  maxDuration: 60,
};

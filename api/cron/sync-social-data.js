// api/cron/sync-social-data.js
const { fetchTikTokPosts, fetchSpotifyArtistStats, fetchInstagramStats } = require("../../lib/apify");
const { upsertTikTokPosts, upsertSpotifyStats, upsertInstagramStats } = require("../../lib/supabaseUpserts");

const TIKTOK_ACCOUNTS = [
  "tony.touchdown",
  "jeanettegrey1",
  "lonny.winter",
  "crynowlaughlater31",
  "lupereallycares",
  "denzel.mursic",
  "denzelcovena",
  "darlinsweetthanggg",
];

const SPOTIFY_ARTIST_URL = "https://open.spotify.com/artist/5rUTMTQfmomgiE54kBHG0U";
const INSTAGRAM_USERNAME = "denzelcovena";

module.exports = async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = { tiktok: null, spotify: null, instagram: null, errors: [] };

  const [tiktokOutcome, spotifyOutcome, instagramOutcome] = await Promise.allSettled([
    fetchTikTokPosts(TIKTOK_ACCOUNTS, 3).then(upsertTikTokPosts),
    fetchSpotifyArtistStats(SPOTIFY_ARTIST_URL).then(upsertSpotifyStats),
    fetchInstagramStats(INSTAGRAM_USERNAME).then(upsertInstagramStats),
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

  if (instagramOutcome.status === "fulfilled") {
    results.instagram = instagramOutcome.value;
  } else {
    console.error("Instagram sync failed:", instagramOutcome.reason);
    results.errors.push({ source: "instagram", message: instagramOutcome.reason.message });
  }

  const status = results.errors.length > 0 ? 207 : 200;
  return res.status(status).json(results);
};

module.exports.config = {
  maxDuration: 60,
};

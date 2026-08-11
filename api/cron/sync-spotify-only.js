// api/cron/sync-spotify-only.js
// Second daily check, Spotify only (TikTok isn't the problem, so no need
// to double that cost). Spotify's own "monthly listeners" number seems to
// refresh at an inconsistent time of day, so this run plus the main nightly
// run together cover a wider window.

const { fetchSpotifyArtistStats } = require("../../lib/apify");
const { upsertSpotifyStats } = require("../../lib/supabaseUpserts");

const SPOTIFY_ARTIST_URL = "https://open.spotify.com/artist/5rUTMTQfmomgiE54kBHG0U";

module.exports = async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const spotifyItems = await fetchSpotifyArtistStats(SPOTIFY_ARTIST_URL);
    const result = await upsertSpotifyStats(spotifyItems);
    return res.status(200).json({ spotify: result, errors: [] });
  } catch (err) {
    console.error("Spotify-only sync failed:", err);
    return res.status(500).json({ spotify: null, errors: [{ source: "spotify", message: err.message }] });
  }
};

module.exports.config = {
  maxDuration: 30,
};

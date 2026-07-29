// lib/supabaseUpserts.js
const { supabaseAdmin } = require("./supabaseAdmin");

/**
 * Maps raw clockworks/tiktok-profile-scraper dataset items into rows for
 * tiktok_posts and upserts them. Field names below match that actor's
 * current output — if you switch actors, this mapping function is the only
 * thing that needs to change.
 */
async function upsertTikTokPosts(rawItems) {
  const rows = rawItems
    .filter((item) => item && item.id) // skip malformed/empty items
    .map((item) => ({
      account_name: item.authorMeta?.name || item.authorMeta?.uniqueId || "unknown",
      video_id: String(item.id),
      video_url: item.webVideoUrl || item.videoUrl || null,
      caption: item.text || null,
      views: item.playCount ?? 0,
      likes: item.diggCount ?? 0,
      comments: item.commentCount ?? 0,
      shares: item.shareCount ?? 0,
      posted_at: item.createTimeISO || null,
      captured_date: new Date().toISOString().slice(0, 10),
    }));

  if (rows.length === 0) {
    return { count: 0 };
  }

  const { data, error } = await supabaseAdmin
    .from("tiktok_posts")
    .upsert(rows, { onConflict: "video_id,captured_date" })
    .select();

  if (error) throw new Error(`Supabase upsert (tiktok_posts) failed: ${error.message}`);
  return { count: data.length };
}

/**
 * Maps a fetch_cat/spotify-scraper artist dataset item into a spotify_stats
 * row. This actor returns one item per artist URL requested.
 */
async function upsertSpotifyStats(rawItems) {
  const item = rawItems[0];
  if (!item) {
    return { count: 0 };
  }

  const row = {
    monthly_listeners: item.monthlyListeners ?? item.stats?.monthlyListeners ?? null,
    followers: item.followers ?? item.stats?.followers ?? null,
    world_rank: item.worldRank ?? item.stats?.worldRank ?? null,
    top_cities: item.topCities ?? null,
    captured_date: new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabaseAdmin
    .from("spotify_stats")
    .upsert([row], { onConflict: "captured_date" })
    .select();

  if (error) throw new Error(`Supabase upsert (spotify_stats) failed: ${error.message}`);
  return { count: data.length };
}

module.exports = { upsertTikTokPosts, upsertSpotifyStats };
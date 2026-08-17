const Scheme = require('../models/Scheme');

/**
 * Fetch and filter YouTube tutorials for a scheme
 * @param {Object} scheme - The scheme document
 * @returns {Array} Array of tutorial objects
 */
async function fetchTutorials(scheme) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.log('[YouTubeService] Missing API Key. Skipping fetch.');
      return [];
    }

    // 1. Build Query
    // E.g. "How to apply for Pradhan Mantri Kisan Maan-Dhan Yojana"
    // We add "how to apply" to ensure we get tutorials, not news
    let query = scheme.youtubeQuery || `how to apply for ${scheme.title}`;
    
    // 2. Fetch Search Results
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', '10');
    searchUrl.searchParams.append('relevanceLanguage', 'hi'); // Prefer Hindi/English regional
    searchUrl.searchParams.append('key', apiKey);

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.log(`[YouTubeService] No videos found for query: ${query}`);
      return [];
    }

    // Extract video IDs to fetch statistics
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // 3. Fetch Statistics (for Trust Filtering)
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.searchParams.append('part', 'statistics,snippet');
    statsUrl.searchParams.append('id', videoIds);
    statsUrl.searchParams.append('key', apiKey);

    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();

    if (!statsData.items) return [];

    // 4. Trust Filtering
    // Filter videos with less than 500 views to avoid spam/unreliable info
    const MIN_VIEWS = 500;
    
    const validVideos = statsData.items.filter(video => {
      const views = parseInt(video.statistics.viewCount, 10);
      return views >= MIN_VIEWS;
    });

    // Sort by view count descending (most popular/trusted first)
    validVideos.sort((a, b) => {
      return parseInt(b.statistics.viewCount, 10) - parseInt(a.statistics.viewCount, 10);
    });

    // Map to our schema format (take top 3)
    const tutorials = validVideos.slice(0, 3).map(video => ({
      videoId: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      channelTitle: video.snippet.channelTitle
    }));

    return tutorials;
  } catch (error) {
    console.error('[YouTubeService] Error fetching tutorials:', error);
    return [];
  }
}

module.exports = {
  fetchTutorials
};

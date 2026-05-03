// ============================================================
// CNC BLOG AGENT — Unimake Works
// Fully automatic: Research → Write → Thumbnail → Publish
// ============================================================
// HOW TO RUN:
//   1. Install Node.js from nodejs.org
//   2. Open terminal/command prompt in this folder
//   3. Run: npm install node-fetch
//   4. Run: node cnc-blog-agent.js
// ============================================================

// ============================================================
// STEP 1 — PASTE YOUR API KEYS HERE
// ============================================================

const CLAUDE_API_KEY    = "PASTE_YOUR_NEW_CLAUDE_API_KEY_HERE";
const IDEOGRAM_API_KEY  = "PASTE_YOUR_NEW_IDEOGRAM_API_KEY_HERE";
const SUPABASE_URL      = "https://onttzurgwjhgyboxcpmy.supabase.co";
const BLOG_API_SECRET   = "unimake2025secret";
const VERCEL_DEPLOY_HOOK = "PASTE_YOUR_VERCEL_DEPLOY_HOOK_URL_HERE"; // optional

// ============================================================
// CONFIGURATION — DO NOT CHANGE
// ============================================================

const BLOG_API_URL = `${SUPABASE_URL}/functions/v1/create-blog`;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/blogs`;
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

const DAY_CATEGORIES = {
  0: "CNC Technology Trends (5-axis, automation, AI in manufacturing, Industry 4.0)",
  1: "CNC Materials (aluminum grades, steel types, plastics, exotic metals)",
  2: "CNC Processes (milling, turning, drilling, EDM, surface finishing)",
  3: "India Manufacturing (Made in India, CNC suppliers India, costs India)",
  4: "Quality and Tolerances (GD&T, inspection, surface finish, tolerances)",
  5: "Cost and Efficiency (reducing machining costs, DFM tips, batch sizing)",
  6: "Industry Applications (CNC for EV, aerospace, robotics, medical devices)"
};

const THUMBNAIL_STYLES = [
  "dark steel CNC workshop background, sparks flying, dramatic industrial lighting",
  "clean white background, technical engineering blueprint style, orange accent colors",
  "macro close-up precision CNC machined metal parts, metallic texture, studio lighting"
];

// ============================================================
// HELPER — Sleep
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// STEP 2 — Fetch existing slugs from Supabase
// ============================================================

async function getExistingSlugs() {
  console.log("📋 Fetching existing blog slugs...");
  try {
    const fetch = (await import("node-fetch")).default;
    const res = await fetch(`${SUPABASE_REST_URL}?select=slug,title&status=eq.published`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await res.json();
    if (!Array.isArray(data)) return { slugs: [], titles: [] };
    return {
      slugs: data.map(b => b.slug),
      titles: data.map(b => b.title)
    };
  } catch (e) {
    console.log("⚠️ Could not fetch existing slugs:", e.message);
    return { slugs: [], titles: [] };
  }
}

// ============================================================
// STEP 3 — Research trending CNC topics
// ============================================================

async function researchTopics(existingTitles) {
  console.log("🔍 Researching trending CNC topics...");
  const fetch = (await import("node-fetch")).default;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayOfWeek];
  const dateStr = today.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const category = DAY_CATEGORIES[dayOfWeek];

  const existingTopicsText = existingTitles.length > 0
    ? `\n\nAlready published titles (DO NOT repeat or write anything similar to these):\n${existingTitles.slice(-20).join("\n")}`
    : "";

  const prompt = `Today is ${dayName}, ${dateStr}.\n\nFocus category for today: ${category}\n\nSearch for the most discussed and trending topics in this category this week. Find what engineers and procurement managers in India are actively searching for right now.${existingTopicsText}\n\nReturn 3 completely unique blog topic ideas that are NOT similar to any already published title above.\n\nReturn as JSON array only with fields: topic, keyword, search_intent, why_it_ranks\nReturn JSON only, no extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude research error: ${JSON.stringify(data)}`);

  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No text response from Claude research");

  console.log("✅ Topics researched successfully");
  return textBlock.text;
}

// ============================================================
// STEP 4 — Write full SEO blog
// ============================================================

async function writeBlog(topicsText, existingTitles) {
  console.log("✍️ Writing SEO blog post...");
  const fetch = (await import("node-fetch")).default;

  const today = new Date();
  const dateSlug = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const timestamp = today.getTime();

  const existingTopicsText = existingTitles.length > 0
    ? `\n\nDO NOT write about any topic similar to these already published blogs:\n${existingTitles.slice(-20).join("\n")}`
    : "";

  const prompt = `From these CNC blog topic ideas:\n\n${topicsText}${existingTopicsText}\n\nPick the single best and most unique topic and write a complete SEO blog post.\n\nIMPORTANT RULES:\n- Write from the perspective of Manish Bandi, Founder of Unimake Works, with 5+ years of hands-on CNC machining experience in Hyderabad, India\n- Include India-specific context, pricing in INR where relevant, and Indian manufacturing examples\n- Include at least one comparison table using plain text format\n- Include specific numbers, tolerances, and technical specs\n- Word count: 1200-1500 words\n- Make it genuinely useful for engineers and procurement managers\n\nReturn ONLY a valid JSON object with these exact keys:\n- title (string)\n- slug (string, lowercase hyphens only, end with -${dateSlug})\n- meta_title (string, under 60 chars, includes primary keyword)\n- meta_description (string, under 155 chars)\n- content (string, plain text only, NO HTML tags, NO double quotes inside content, use HEADING: for H2 sections, SUBHEADING: for H3 sections)\n- tags (array of 5 strings)\n- thumbnail_prompt (string, maximum 5 words describing the blog topic visually)\n\nReturn JSON only. No markdown fences. No extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude blog error: ${JSON.stringify(data)}`);

  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No text response from Claude blog writer");

  // Parse JSON safely
  let text = textBlock.text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  text = text.substring(start, end + 1);

  const blog = JSON.parse(text);

  // Add timestamp to slug to guarantee uniqueness
  blog.slug = blog.slug + "-" + timestamp;

  // Convert plain text content to clean HTML
  const lines = blog.content.split("\n").filter(l => l.trim());
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("HEADING:")) {
      html += `<h2>${trimmed.replace("HEADING:", "").trim()}</h2>\n`;
    } else if (trimmed.startsWith("SUBHEADING:")) {
      html += `<h3>${trimmed.replace("SUBHEADING:", "").trim()}</h3>\n`;
    } else if (trimmed.startsWith("|")) {
      html += `<p>${trimmed}</p>\n`;
    } else if (trimmed.length > 0) {
      html += `<p>${trimmed}</p>\n`;
    }
  }

  // Add CTA at end
  html += `<h2>Get Precision CNC Parts from Unimake Works</h2>\n<p>Looking for high-quality CNC machined parts with tight tolerances? Unimake Works delivers precision parts with fast turnaround and competitive pricing. <a href="https://www.unimakeworks.com/request-quote">Get a free CNC quote today</a> and experience the difference of working with a trusted Indian manufacturer.</p>`;

  blog.content = html;

  console.log(`✅ Blog written: ${blog.title}`);
  return blog;
}

// ============================================================
// STEP 5 — Generate thumbnail
// ============================================================

async function generateThumbnail(blog) {
  console.log("🖼️ Generating thumbnail...");
  const fetch = (await import("node-fetch")).default;

  const dayOfWeek = new Date().getDay();
  const styleIndex = dayOfWeek % 3;
  const style = THUMBNAIL_STYLES[styleIndex];
  const fullPrompt = `${blog.thumbnail_prompt}, ${style}, bold white text overlay maximum 4 words, 1200x630px professional`;

  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: {
      "Api-Key": IDEOGRAM_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_request: {
        prompt: fullPrompt,
        aspect_ratio: "ASPECT_16_9",
        model: "V_2",
        magic_prompt_option: "AUTO"
      }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Ideogram error: ${JSON.stringify(data)}`);

  const imageUrl = data.data[0].url;
  console.log("✅ Thumbnail generated");
  return imageUrl;
}

// ============================================================
// STEP 6 — Publish blog to Supabase
// ============================================================

async function publishBlog(blog, thumbnailUrl) {
  console.log("📤 Publishing blog to website...");
  const fetch = (await import("node-fetch")).default;

  const payload = {
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    meta_title: blog.meta_title,
    meta_description: blog.meta_description,
    thumbnail_source_url: thumbnailUrl,
    tags: blog.tags,
    status: "published",
    author: "Manish Bandi"
  };

  const response = await fetch(BLOG_API_URL, {
    method: "POST",
    headers: {
      "x-blog-api-secret": BLOG_API_SECRET,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Publish error: ${JSON.stringify(data)}`);

  console.log("✅ Blog published successfully!");
  return data;
}

// ============================================================
// STEP 7 — Trigger Vercel rebuild
// ============================================================

async function triggerVercelRebuild() {
  if (!VERCEL_DEPLOY_HOOK || VERCEL_DEPLOY_HOOK === "PASTE_YOUR_VERCEL_DEPLOY_HOOK_URL_HERE") {
    console.log("⏭️ Skipping Vercel rebuild (no hook configured)");
    return;
  }
  console.log("🔄 Triggering Vercel rebuild...");
  const fetch = (await import("node-fetch")).default;
  await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
  console.log("✅ Vercel rebuild triggered");
}

// ============================================================
// MAIN — Run everything
// ============================================================

async function main() {
  console.log("\n🚀 CNC Blog Agent Starting...");
  console.log("=".repeat(50));

  try {
    // Step 1 — Get existing blogs to avoid repetition
    const { slugs, titles } = await getExistingSlugs();
    console.log(`📊 Found ${titles.length} existing blogs`);

    // Step 2 — Research topics
    const topicsText = await researchTopics(titles);

    // Step 3 — Wait 90 seconds to avoid Claude rate limit
    console.log("⏳ Waiting 90 seconds before blog writing...");
    await sleep(90000);

    // Step 4 — Write blog
    const blog = await writeBlog(topicsText, titles);

    // Step 5 — Generate thumbnail
    const thumbnailUrl = await generateThumbnail(blog);

    // Step 6 — Publish
    await publishBlog(blog, thumbnailUrl);

    // Step 7 — Trigger Vercel rebuild
    await triggerVercelRebuild();

    console.log("=".repeat(50));
    console.log("✅ ALL DONE!");
    console.log(`📝 Title: ${blog.title}`);
    console.log(`🔗 URL: https://www.unimakeworks.com/blog/${blog.slug}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("Fix the error and run again.");
    process.exit(1);
  }
}

main();
